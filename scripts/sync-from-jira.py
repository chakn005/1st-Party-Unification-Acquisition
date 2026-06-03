#!/usr/bin/env python3
"""Sync 1st Party Unification Acquisition console from Jira epic CPTR-72227."""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
DATA_JSON = ROOT / "shared" / "data.json"
DATA_JS = ROOT / "shared" / "data.js"
INDEX_HTML = ROOT / "index.html"
EPIC_KEY = "CPTR-72227"

ENV_CANDIDATES = [
    ROOT / ".env",
    Path(__file__).resolve().parents[2] / "POC" / "delta-gemini-console" / ".env",
    Path(__file__).resolve().parents[2] / "mcp-servers" / "jira-mcp-server" / ".env",
]

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
    "blocked": "blocked",
    "impediment": "blocked",
    "on hold": "blocked",
    "to do": "pending",
    "open": "pending",
    "backlog": "pending",
    "new": "pending",
    "todo": "pending",
}

PHASE_KEYWORDS = {
    "partner-setup": ["cpm", "partner", "cp id", "cp user", "external identifier"],
    "rights": ["rightsline", "rights", "distribution rights", "dro"],
    "avail-pipeline": ["avail", "ema", "falcon", "s3 key"],
    "amp-pipeline": ["amp", "mmc"],
    "av-pipeline": [" av ", "audio", "video", "mastering", "localization", "alid"],
    "dtc-delivery": ["dtc", "disney+", "espn", "hulu", "portal", "catalog", "unified acquisition", "unified acq"],
}

SYSTEM_KEYWORDS = {
    "cpm": ["cpm", "content partner"],
    "rightsline": ["rightsline", "rights line"],
    "falcon": ["falcon", "ema avail"],
    "dtc-ua": ["unified acquisition", "dtc acquisition", "dtc ua"],
    "dtc-catalog": ["catalog", "alid", "content id"],
    "amp": [" amp", "asset management"],
    "sip": ["sip", "delivery", "s3"],
    "content-portal": ["content portal", "portal"],
    "dtc": ["disney+", "espn+", "hulu", "dtc platform"],
}


def map_jira_status(name: str | None) -> str:
    if not name:
        return "pending"
    return JIRA_STATUS_MAP.get(name.strip().lower(), "pending")


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

    server = (server or "https://jira.disney.com").rstrip("/")
    return server, token or "", username, password, source


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
            raise RuntimeError(
                "Jira returned non-JSON (likely SSO redirect). Connect to VPN and retry."
            )
        return resp.json()

    def issue(self, key: str) -> dict:
        return self._get(
            f"/rest/api/2/issue/{key}",
            params={
                "fields": "summary,status,assignee,reporter,updated,created,description,issuetype,labels,components"
            },
        )

    def search(self, jql: str, max_results: int = 200) -> list:
        data = self._get(
            "/rest/api/2/search",
            params={
                "jql": jql,
                "maxResults": max_results,
                "fields": "summary,status,assignee,updated,issuetype,labels,components",
            },
        )
        return data.get("issues", [])


def infer_phase(summary: str, labels: list[str]) -> str | None:
    text = f"{summary} {' '.join(labels)}".lower()
    for phase_id, keywords in PHASE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return phase_id
    return None


def infer_system(summary: str, labels: list[str]) -> str | None:
    text = f" {summary} {' '.join(labels)} ".lower()
    for system_id, keywords in SYSTEM_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return system_id
    return None


def infer_workflow_steps(data: dict, phase_id: str | None, system_id: str | None) -> list[str]:
    steps = data.get("workflowSteps", [])
    matches = []
    for step in steps:
        if phase_id and step.get("phase") != phase_id:
            continue
        if system_id and step.get("system") != system_id:
            continue
        if phase_id or system_id:
            matches.append(step["id"])
    return matches[:3]


def issue_to_work_item(issue: dict, data: dict) -> dict:
    fields = issue["fields"]
    labels = fields.get("labels") or []
    components = [c.get("name", "") for c in (fields.get("components") or [])]
    summary = fields.get("summary") or issue["key"]
    jira_status = (fields.get("status") or {}).get("name", "Unknown")
    phase_id = infer_phase(summary, labels + components)
    system_id = infer_system(summary, labels + components)
    step_ids = infer_workflow_steps(data, phase_id, system_id)

    return {
        "key": issue["key"],
        "summary": summary,
        "url": f"{data['jira']['baseUrl']}/browse/{issue['key']}",
        "jiraStatus": jira_status,
        "status": map_jira_status(jira_status),
        "issueType": (fields.get("issuetype") or {}).get("name"),
        "assignee": (fields.get("assignee") or {}).get("displayName"),
        "updated": (fields.get("updated") or "")[:10],
        "phaseId": phase_id,
        "systemId": system_id,
        "workflowStepIds": step_ids,
        "labels": labels,
    }


def epic_to_record(issue: dict, server: str) -> dict:
    fields = issue["fields"]
    key = issue["key"]
    jira_status = (fields.get("status") or {}).get("name", "Unknown")
    return {
        "key": key,
        "summary": fields.get("summary") or key,
        "url": f"{server}/browse/{key}",
        "jiraStatus": jira_status,
        "status": map_jira_status(jira_status),
        "assignee": (fields.get("assignee") or {}).get("displayName"),
        "updated": fields.get("updated"),
    }


def fetch_epic_children(client: JiraClient, epic_key: str) -> list:
    queries = [
        f'"Epic Link" = {epic_key}',
        f'parent = {epic_key}',
        f'issue in linkedIssues({epic_key})',
        f'project = CPTR AND text ~ "Unification" ORDER BY updated DESC',
    ]
    seen: set[str] = set()
    issues: list = []
    for jql in queries:
        try:
            batch = client.search(jql)
        except RuntimeError:
            continue
        for issue in batch:
            key = issue.get("key")
            if key and key != epic_key and key not in seen:
                seen.add(key)
                issues.append(issue)
    return issues


def write_data_files(data: dict) -> None:
    payload = json.dumps(data, indent=2, ensure_ascii=False)
    DATA_JSON.write_text(payload + "\n", encoding="utf-8")
    DATA_JS.write_text(
        f"/* 1st Party Unification Acquisition — shared data (auto-generated from data.json) */\n"
        f"window.ACQUISITION_DATA = {payload};\n",
        encoding="utf-8",
    )


def bump_asset_cache_version(data: dict) -> bool:
    version = (data.get("jira") or {}).get("dataVersion")
    if not version or not INDEX_HTML.exists():
        return False
    text = INDEX_HTML.read_text(encoding="utf-8")
    updated = re.sub(r"\?v=[^\"']+", f"?v={version}", text)
    if updated == text:
        return False
    INDEX_HTML.write_text(updated, encoding="utf-8")
    return True


def verify_auth(client: JiraClient, source: str) -> None:
    try:
        client._get("/rest/api/2/myself")
    except RuntimeError as exc:
        raise RuntimeError(
            f"Jira authentication failed using {source}. "
            "Use corporate VPN and valid JIRA_TOKEN. "
            f"Original error: {exc}"
        ) from exc


def main() -> int:
    server, token, username, password, source = load_credentials()
    if not token and not (username and password):
        print("Missing Jira credentials. Copy .env.example to .env or use POC/mcp .env", file=sys.stderr)
        return 1

    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    client = JiraClient(server, token, username, password)
    print(f"Using credentials from: {source}")
    verify_auth(client, source)

    epic_issue = client.issue(EPIC_KEY)
    data["epicIssue"] = epic_to_record(epic_issue, server)
    print(f"Epic {EPIC_KEY}: {data['epicIssue']['summary']} | Jira={data['epicIssue']['jiraStatus']}")

    children = fetch_epic_children(client, EPIC_KEY)
    work_items = [issue_to_work_item(issue, data) for issue in children]
    data["workItems"] = sorted(work_items, key=lambda w: w["key"])
    print(f"Loaded {len(work_items)} work items under epic")

    for item in work_items[:15]:
        print(
            f"  {item['key']}: {item['summary'][:60]} | phase={item.get('phaseId')} | "
            f"system={item.get('systemId')} | {item['jiraStatus']}"
        )
    if len(work_items) > 15:
        print(f"  ... and {len(work_items) - 15} more")

    data["jira"] = {
        **(data.get("jira") or {}),
        "baseUrl": server,
        "browsePath": "/browse/",
        "epicKey": EPIC_KEY,
        "lastSynced": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "syncSource": "scripts/sync-from-jira.py",
        "syncRequired": False,
        "dataVersion": datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S"),
    }

    write_data_files(data)
    if bump_asset_cache_version(data):
        print(f"Updated cache version in {INDEX_HTML.name}")
    print(f"\nUpdated {DATA_JSON} and {DATA_JS}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Sync failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
