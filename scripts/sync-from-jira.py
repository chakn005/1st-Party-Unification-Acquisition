#!/usr/bin/env python3
"""Sync acquisition console from epic CPTR-72227 and linked Xray test plans."""

from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
DATA_JSON = ROOT / "shared" / "data.json"
DATA_JS = ROOT / "shared" / "data.js"
INDEX_HTML = ROOT / "index.html"
EPIC_KEY = "CPTR-72227"
M1_CROSS_ALLIANCE_KEY = "CPTR-72676"

M1_HEATMAP_COLUMNS = [
    {"id": "metadata-artwork", "label": "Metadata/Artwork", "short": "Metadata/Artwork"},
    {"id": "av-assets", "label": "AV Assets", "short": "AV Assets"},
    {"id": "avails-rights", "label": "Avails/Rights", "short": "Avails/Rights"},
    {"id": "title-planning", "label": "Title Planning", "short": "Title Planning"},
    {"id": "s3-ingest", "label": "S3 Ingest", "short": "S3 Ingest"},
]

OVERVIEW_ALLIANCES = [
    {"id": "content", "name": "Content Platform", "color": "#0d9488"},
    {"id": "media", "name": "Media Platform", "color": "#7c3aed"},
    {"id": "streaming", "name": "Streaming Alliances", "color": "#1f80e0"},
]

M1_COLUMN_KEYWORDS: dict[str, tuple[str, ...]] = {
    "metadata-artwork": ("metadata", "artwork", "mmc", "manifest"),
    "av-assets": ("av asset", "av assets", "audio", "video asset", "picture version"),
    "avails-rights": ("avail", "rights", "rightsline", "falcon", "ema"),
    "title-planning": ("title plan", "title planning", "catalog", "alid"),
    "s3-ingest": ("s3", "ingest", "storage", "bucket"),
}

ALLIANCE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "content": ("content platform", "content alliance", "rightsline", "falcon", "cpm", "fda", "content portal"),
    "media": ("media platform", "media alliance", " amp ", " sip ", " sip-", "av delivery", "xavier"),
    "streaming": ("streaming alliance", "streaming", "dtc", "hulu", "disney+", "espn", "unified acquisition", "catalog ingest"),
}

HEATMAP_STATUS_RANK = {"completed": 0, "in-progress": 1, "pending": 2, "risk": 3}

PRIMARY_PLANS = {
    "milestone1": "DMEDNINJA-17790",
    "milestone2": "DMEDNINJA-17818",
    "amp": "OMFG-19970",
}

MILESTONE2_PIPELINE_KEYS = frozenset({"RIGHTS-28328", "RIGHTS-28094", "RIGHTS-28225"})

RELATED_PLAN_PREFIXES = ("RIGHTS-", "RMS-")

ENV_CANDIDATES = [
    ROOT / ".env",
    Path(__file__).resolve().parents[2] / "POC" / "delta-gemini-console" / ".env",
    Path(__file__).resolve().parents[2] / "mcp-servers" / "jira-mcp-server" / ".env",
]

STATUS_MAP = {
    "PASS": "completed",
    "PASSED": "completed",
    "DONE": "completed",
    "TODO": "pending",
    "TO DO": "pending",
    "NOT RUN": "pending",
    "NOTRUN": "pending",
    "EXECUTING": "in-progress",
    "IN PROGRESS": "in-progress",
    "FAIL": "fail",
    "FAILED": "fail",
    "BLOCKED": "blocked",
    "ABORTED": "blocked",
}

JIRA_STATUS_MAP = {
    "done": "completed",
    "closed": "completed",
    "resolved": "completed",
    "complete": "completed",
    "completed": "completed",
    "in progress": "in-progress",
    "in development": "in-progress",
    "implementing": "in-progress",
    "active": "in-progress",
    "new": "pending",
    "to do": "pending",
    "open": "pending",
    "backlog": "pending",
    "blocked": "blocked",
}


def map_xray(name: str | None) -> str:
    if not name:
        return "pending"
    return STATUS_MAP.get(name.strip().upper(), "pending")


def map_jira_status(name: str | None) -> str:
    if not name:
        return "pending"
    return JIRA_STATUS_MAP.get(name.strip().lower(), "pending")


def map_jira_status(name: str | None) -> str:
    if not name:
        return "pending"
    return JIRA_STATUS_MAP.get(name.strip().lower(), "pending")


def map_heatmap_status(name: str | None) -> str:
    """Map Jira issue status to heatmap cell status (pending | in-progress | completed | risk)."""
    if not name:
        return "pending"
    low = name.strip().lower()
    if any(k in low for k in ("risk", "blocked", "impediment", "fail", "failed", "aborted")):
        return "risk"
    if any(k in low for k in ("done", "closed", "resolved", "complete", "completed")):
        return "completed"
    if any(k in low for k in ("progress", "development", "active", "implementing")):
        return "in-progress"
    return "pending"


def merge_heatmap_status(current: str, incoming: str) -> str:
    """Keep the more severe status when multiple Jira issues map to one cell."""
    return current if HEATMAP_STATUS_RANK[current] >= HEATMAP_STATUS_RANK[incoming] else incoming


def build_empty_m1_heatmap_cells() -> dict:
    col_ids = [c["id"] for c in M1_HEATMAP_COLUMNS]
    return {
        aid: {cid: {"status": "pending", "jiraKey": None, "summary": None} for cid in col_ids}
        for aid in (a["id"] for a in OVERVIEW_ALLIANCES)
    }


def classify_heatmap_cell(summary: str) -> tuple[str | None, str | None]:
    text = f" {summary.lower()} "
    col_id: str | None = None
    for col in M1_HEATMAP_COLUMNS:
        label = col["label"].lower()
        if label in text or label.replace("/", " ") in text:
            col_id = col["id"]
            break
    if not col_id:
        for cid, keywords in M1_COLUMN_KEYWORDS.items():
            if any(k in text for k in keywords):
                col_id = cid
                break
    alliance_id: str | None = None
    for aid, keywords in ALLIANCE_KEYWORDS.items():
        if any(k in text for k in keywords):
            alliance_id = aid
            break
    return alliance_id, col_id


def sync_program_heatmaps(client: JiraClient, server: str, data: dict) -> None:
    cells = build_empty_m1_heatmap_cells()
    epic_key = M1_CROSS_ALLIANCE_KEY
    epic = client.issue(epic_key)
    ef = epic["fields"]
    matched = 0

    for issue in fetch_epic_children(client, epic_key):
        fields = issue.get("fields") or {}
        summary = fields.get("summary") or issue.get("key", "")
        alliance_id, col_id = classify_heatmap_cell(summary)
        if not alliance_id or not col_id:
            continue
        st = map_heatmap_status(fields.get("status", {}).get("name"))
        key = issue.get("key")
        slot = cells[alliance_id][col_id]
        cells[alliance_id][col_id] = {
            "status": merge_heatmap_status(slot["status"], st),
            "jiraKey": key,
            "summary": summary[:160],
        }
        matched += 1

    m1 = {
        "id": "m1-cross-alliance",
        "title": "Milestone 1 Cross Alliance Testing",
        "subtitle": "Cross-alliance integration status by track — sourced from Jira epic",
        "jiraKey": epic_key,
        "jiraUrl": f"{server}/browse/{epic_key}",
        "jiraStatus": ef.get("status", {}).get("name", "Unknown"),
        "available": True,
        "columns": M1_HEATMAP_COLUMNS,
        "alliances": OVERVIEW_ALLIANCES,
        "cells": cells,
        "issuesMapped": matched,
    }

    m2 = {
        "id": "m2-cross-alliance",
        "title": "Milestone 2 Cross Alliance Testing",
        "subtitle": "Test plan not yet defined in Jira",
        "jiraKey": None,
        "jiraUrl": None,
        "jiraStatus": None,
        "available": False,
        "placeholderMessage": "Milestone 2 cross-alliance test plan is not yet available. Heatmap will populate when linked in Jira.",
        "columns": M1_HEATMAP_COLUMNS,
        "alliances": OVERVIEW_ALLIANCES,
        "cells": None,
    }

    data["programHeatmaps"] = [m1, m2]
    print(f"Program heatmap {epic_key}: {ef.get('summary', epic_key)[:60]} | {matched} child issues mapped to cells")


def load_credentials() -> tuple[str, str, str | None, str | None, str]:
    token = os.getenv("JIRA_TOKEN")
    username = os.getenv("JIRA_USERNAME")
    password = os.getenv("JIRA_PASSWORD")
    server = os.getenv("JIRA_SERVER")
    source = "environment variable JIRA_TOKEN" if token else "unknown"

    for env_path in ENV_CANDIDATES:
        if not env_path.exists():
            continue
        load_dotenv(env_path, override=not token)
        if not token and os.getenv("JIRA_TOKEN"):
            token = os.getenv("JIRA_TOKEN")
            source = str(env_path)
        if not server:
            server = os.getenv("JIRA_SERVER")
        if not username:
            username = os.getenv("JIRA_USERNAME")
        if not password:
            password = os.getenv("JIRA_PASSWORD")

    return (server or "https://jira.disney.com").rstrip("/"), token or "", username, password, source


class JiraClient:
    def __init__(
        self,
        server: str,
        token: str = "",
        username: str | None = None,
        password: str | None = None,
    ) -> None:
        self.server = server.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json", "Content-Type": "application/json"})
        if token:
            self.session.headers["Authorization"] = f"Bearer {token}"
        elif username and password:
            self.session.auth = (username, password)
        else:
            raise RuntimeError("No Jira credentials found.")

    def _get(self, path: str, **kwargs):
        url = f"{self.server}{path}"
        resp = self.session.get(url, timeout=60, **kwargs)
        if resp.status_code >= 400:
            raise RuntimeError(f"GET {path} failed ({resp.status_code}): {resp.text[:240]}")
        if "application/json" not in resp.headers.get("Content-Type", ""):
            raise RuntimeError("Jira returned non-JSON (VPN/SSO required).")
        return resp.json()

    def issue(self, key: str) -> dict:
        return self._get(
            f"/rest/api/2/issue/{key}",
            params={"fields": "summary,status,assignee,reporter,updated,created,issuetype"},
        )

    def search(self, jql: str, max_results: int = 100) -> list:
        data = self._get(
            "/rest/api/2/search",
            params={
                "jql": jql,
                "maxResults": max_results,
                "fields": "summary,status,assignee,updated,issuetype",
            },
        )
        return data.get("issues", [])

    def testplan_tests(self, plan_key: str) -> list:
        page = 1
        results: list = []
        while True:
            data = self._get(
                f"/rest/raven/1.0/api/testplan/{plan_key}/test",
                params={"limit": 100, "page": page},
            )
            batch = data if isinstance(data, list) else []
            if not batch:
                break
            results.extend(batch)
            if len(batch) < 100:
                break
            page += 1
        return results


def aggregate_plan_stats(client: JiraClient, plan_key: str) -> dict:
    counters: Counter = Counter()
    tests = client.testplan_tests(plan_key)
    total = len(tests)
    for test in tests:
        raw = test.get("latestStatus")
        name = raw.get("name") if isinstance(raw, dict) else raw
        counters[map_xray(name)] += 1
    if not counters and total:
        counters["pending"] = total

    pass_count = counters.get("completed", 0)
    fail_count = counters.get("fail", 0)
    blocked_count = counters.get("blocked", 0)
    in_progress = counters.get("in-progress", 0)
    pending = counters.get("pending", 0)
    coverage = min(100, round((pass_count / total) * 100)) if total else 0

    if pass_count or fail_count or blocked_count or in_progress:
        xray_activity = "in-progress"
    else:
        xray_activity = "pending"

    return {
        "total": total,
        "pass": pass_count,
        "fail": fail_count,
        "blocked": blocked_count,
        "inProgress": in_progress,
        "pending": pending,
        "coverage": coverage,
        "status": xray_activity,
    }


def derive_execution_status(jira_status: str | None, stats: dict) -> str:
    """Complete only when the Jira test plan issue is Done — not when all Xray tests pass."""
    jira_key = map_jira_status(jira_status)
    if stats.get("fail"):
        return "fail"
    if jira_key == "completed":
        return "completed"
    if jira_key == "blocked":
        return "blocked"
    if jira_key == "pending" and stats.get("status") == "pending":
        return "pending"
    return "in-progress"


def issue_to_plan(issue: dict, stats: dict, server: str, milestone_id: str | None = None) -> dict:
    fields = issue["fields"]
    key = issue["key"]
    summary = fields.get("summary") or key
    jira_status = fields.get("status", {}).get("name", "Unknown")
    return {
        "id": key,
        "milestoneId": milestone_id,
        "name": summary,
        "shortName": summary.split(" - ")[-1] if " - " in summary else summary,
        "url": f"{server}/browse/{key}",
        "jiraStatus": jira_status,
        "status": map_jira_status(jira_status),
        "executionStatus": derive_execution_status(jira_status, stats),
        "coverage": stats["coverage"],
        "pass": stats["pass"],
        "fail": stats["fail"],
        "blocked": stats["blocked"],
        "inProgress": stats["inProgress"],
        "pending": stats["pending"],
        "total": stats["total"],
        "updated": (fields.get("updated") or "")[:10],
        "assignee": (fields.get("assignee") or {}).get("displayName"),
        "issueType": (fields.get("issuetype") or {}).get("name"),
    }


def fetch_epic_children(client: JiraClient, epic_key: str) -> list:
    seen: set[str] = set()
    issues: list = []
    for jql in (
        f'"Epic Link" = {epic_key}',
        f"parent = {epic_key}",
        f"issue in linkedIssues({epic_key})",
    ):
        try:
            for issue in client.search(jql):
                key = issue.get("key")
                if key and key not in seen and key != epic_key:
                    seen.add(key)
                    issues.append(issue)
        except RuntimeError:
            continue
    return issues


def classify_plan(key: str, summary: str) -> str | None:
    text = f"{key} {summary}".lower()
    if key == PRIMARY_PLANS["milestone1"] or "milestone_1" in text or "milestone 1" in text:
        return "milestone1"
    if key == PRIMARY_PLANS["milestone2"] or "milestone_2" in text or "milestone 2" in text:
        return "milestone2"
    if key == PRIMARY_PLANS["amp"] or (key == "OMFG-19970"):
        return "amp"
    if key.startswith(RELATED_PLAN_PREFIXES) or "test plan" in text:
        return infer_related_milestone(key, summary) or "related"
    return None


def infer_related_milestone(key: str, summary: str) -> str | None:
    """Map pipeline test plans to the milestone they support."""
    if key in MILESTONE2_PIPELINE_KEYS:
        return "milestone2"
    text = f"{key} {summary}".lower()
    if "milestone_1" in text or "milestone 1" in text:
        return "milestone1"
    if "milestone_2" in text or "milestone 2" in text:
        return "milestone2"
    if " amp " in f" {text} " or "omfg-" in text:
        return "amp"
    if "unified acquisition" in text or "rms-md" in text or "rms md" in text:
        return "milestone2"
    if "streaming" in text or ("ingest" in text and "amp" not in text):
        return "milestone2"
    if "fda" in text:
        return "milestone2"
    if "falcon" in text:
        return "milestone2"
    if "avail" in text:
        return "milestone1"
    return None


def write_data_files(data: dict) -> None:
    payload = json.dumps(data, indent=2, ensure_ascii=False)
    DATA_JSON.write_text(payload + "\n", encoding="utf-8")
    DATA_JS.write_text(
        "/* Auto-generated from data.json — run scripts/sync-from-jira.py */\n"
        f"window.ACQUISITION_DATA = {payload};\n",
        encoding="utf-8",
    )


def bump_cache_version(data: dict) -> None:
    version = (data.get("jira") or {}).get("dataVersion")
    if not version or not INDEX_HTML.exists():
        return
    text = INDEX_HTML.read_text(encoding="utf-8")
    updated = re.sub(r"\?v=[^\"']+", f"?v={version}", text)
    if updated != text:
        INDEX_HTML.write_text(updated, encoding="utf-8")


def load_base_data() -> dict:
    if DATA_JSON.exists():
        return json.loads(DATA_JSON.read_text(encoding="utf-8"))
    return {}


def main() -> int:
    server, token, username, password, source = load_credentials()
    if not token and not (username and password):
        print("Missing JIRA_TOKEN in .env", file=sys.stderr)
        return 1

    data = load_base_data()
    client = JiraClient(server, token, username, password)
    print(f"Using credentials from: {source}")
    client._get("/rest/api/2/myself")

    epic = client.issue(EPIC_KEY)
    ef = epic["fields"]
    data["epic"] = {
        "key": EPIC_KEY,
        "summary": ef.get("summary") or EPIC_KEY,
        "url": f"{server}/browse/{EPIC_KEY}",
        "jiraStatus": ef.get("status", {}).get("name", "Unknown"),
        "status": map_jira_status(ef.get("status", {}).get("name")),
        "assignee": (ef.get("assignee") or {}).get("displayName"),
        "updated": (ef.get("updated") or "")[:10],
    }
    print(f"Epic {EPIC_KEY}: {data['epic']['summary']} | {data['epic']['jiraStatus']}")

    milestones_cfg = data.get("milestones") or []
    milestone_by_id = {m["id"]: m for m in milestones_cfg}

    primary_plans: dict[str, dict] = {}
    linked_by_milestone: dict[str, list] = {mid: [] for mid in PRIMARY_PLANS}
    related_plans: list[dict] = []

    for mid, key in PRIMARY_PLANS.items():
        issue = client.issue(key)
        stats = aggregate_plan_stats(client, key)
        plan = issue_to_plan(issue, stats, server, mid)
        primary_plans[mid] = plan
        if mid in milestone_by_id:
            milestone_by_id[mid]["testPlan"] = plan
        print(
            f"{mid}: {key} | Jira={plan['jiraStatus']} | "
            f"tests {plan['pass']}/{plan['total']} pass | coverage={plan['coverage']}%"
        )

    for issue in fetch_epic_children(client, EPIC_KEY):
        key = issue["key"]
        if key in PRIMARY_PLANS.values() or key == EPIC_KEY or key == M1_CROSS_ALLIANCE_KEY:
            continue
        summary = issue["fields"].get("summary") or key
        bucket = classify_plan(key, summary)
        if not bucket:
            continue
        stats = aggregate_plan_stats(client, key)
        plan = issue_to_plan(issue, stats, server, bucket)
        if bucket in linked_by_milestone:
            linked_by_milestone[bucket].append(plan)
            print(f"  linked → {bucket}: {key} | {summary[:50]}")
        elif bucket == "related":
            related_plans.append(plan)
        else:
            related_plans.append(plan)

    data["milestones"] = list(milestone_by_id.values()) if milestone_by_id else _default_milestones(primary_plans)
    for m in data["milestones"]:
        tid = m.get("id")
        if tid and tid in primary_plans:
            m["testPlan"] = primary_plans[tid]
        if tid:
            m["linkedTestPlans"] = sorted(linked_by_milestone.get(tid, []), key=lambda p: p["id"])

    data["relatedTestPlans"] = sorted(related_plans, key=lambda p: p["id"])
    data["programRollup"] = compute_program_rollup(data)

    try:
        sync_program_heatmaps(client, server, data)
    except RuntimeError as exc:
        print(f"Program heatmap sync skipped: {exc}", file=sys.stderr)
        if not data.get("programHeatmaps"):
            data["programHeatmaps"] = _default_program_heatmaps(server)

    version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    data["jira"] = {
        **(data.get("jira") or {}),
        "baseUrl": server,
        "browsePath": "/browse/",
        "epicKey": EPIC_KEY,
        "lastSynced": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "syncSource": "scripts/sync-from-jira.py",
        "syncRequired": False,
        "syncTestPlans": list(PRIMARY_PLANS.values()),
        "dataVersion": version,
    }

    write_data_files(data)
    bump_cache_version(data)
    print(f"\nUpdated {DATA_JSON}")
    return 0


def _default_milestones(plans: dict) -> list:
    return [
        {
            "id": "milestone1",
            "name": "Milestone 1",
            "subtitle": "SIP — Avail & early acquisition path",
            "testPlan": plans.get("milestone1"),
            "workflowZoneIds": ["partner", "avail", "storage-in"],
        },
        {
            "id": "milestone2",
            "name": "Milestone 2",
            "subtitle": "SIP — AV delivery & catalog finalization",
            "testPlan": plans.get("milestone2"),
            "workflowZoneIds": ["av-delivery", "dtc-out"],
        },
        {
            "id": "amp",
            "name": "AMP Test Plan",
            "subtitle": "AMP order, SIP delivery, DTC ingest",
            "testPlan": plans.get("amp"),
            "workflowZoneIds": ["amp-path"],
        },
    ]


def _default_program_heatmaps(server: str) -> list:
    return [
        {
            "id": "m1-cross-alliance",
            "title": "Milestone 1 Cross Alliance Testing",
            "subtitle": "Cross-alliance integration status by track — sourced from Jira epic",
            "jiraKey": M1_CROSS_ALLIANCE_KEY,
            "jiraUrl": f"{server}/browse/{M1_CROSS_ALLIANCE_KEY}",
            "jiraStatus": "Unknown",
            "available": True,
            "columns": M1_HEATMAP_COLUMNS,
            "alliances": OVERVIEW_ALLIANCES,
            "cells": build_empty_m1_heatmap_cells(),
            "issuesMapped": 0,
        },
        {
            "id": "m2-cross-alliance",
            "title": "Milestone 2 Cross Alliance Testing",
            "subtitle": "Test plan not yet defined in Jira",
            "jiraKey": None,
            "jiraUrl": None,
            "jiraStatus": None,
            "available": False,
            "placeholderMessage": "Milestone 2 cross-alliance test plan is not yet available. Heatmap will populate when linked in Jira.",
            "columns": M1_HEATMAP_COLUMNS,
            "alliances": OVERVIEW_ALLIANCES,
            "cells": None,
        },
    ]


def collect_program_test_plans(data: dict) -> list[dict]:
    """Primary + linked test plans across all milestones (deduped by issue key)."""
    seen: set[str] = set()
    plans: list[dict] = []
    for m in data.get("milestones", []):
        for p in [m.get("testPlan"), *(m.get("linkedTestPlans") or [])]:
            key = p.get("id") if p else None
            if key and key not in seen:
                seen.add(key)
                plans.append(p)
    return plans


def compute_program_rollup(data: dict) -> dict:
    plans = collect_program_test_plans(data)
    if not plans:
        return {
            "status": data.get("epic", {}).get("status", "pending"),
            "coverage": 0,
            "pass": 0,
            "fail": 0,
            "pending": 0,
            "total": 0,
            "planCount": 0,
            "plansComplete": 0,
            "milestonesComplete": 0,
            "milestoneTotal": 0,
        }

    total = sum(p.get("total", 0) for p in plans)
    passed = sum(p.get("pass", 0) for p in plans)
    failed = sum(p.get("fail", 0) for p in plans)
    pending = sum(p.get("pending", 0) for p in plans)
    coverage = min(100, round((passed / total) * 100)) if total else 0
    plans_complete = sum(1 for p in plans if p.get("executionStatus") == "completed")

    statuses = [p.get("executionStatus", "pending") for p in plans]
    if all(s == "completed" for s in statuses):
        prog_status = "completed"
    elif any(s in ("fail", "blocked") for s in statuses):
        prog_status = "fail" if any(s == "fail" for s in statuses) else "blocked"
    elif any(s == "in-progress" for s in statuses) or passed:
        prog_status = "in-progress"
    else:
        prog_status = "pending"

    plan_count = len(plans)
    return {
        "status": prog_status,
        "coverage": coverage,
        "pass": passed,
        "fail": failed,
        "pending": pending,
        "total": total,
        "planCount": plan_count,
        "plansComplete": plans_complete,
        "milestonesComplete": plans_complete,
        "milestoneTotal": plan_count,
    }


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Sync failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
