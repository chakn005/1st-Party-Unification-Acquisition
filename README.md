# 1st Party Unification Acquisition — Leadership Console

Executive dashboard for tracking **1st Party Unification Acquisition** implementation progress, structured from epic [CPTR-72227](https://jira.disney.com/browse/CPTR-72227) and the architecture / swimlane diagrams in this repo.

Inspired by the [Delta Gemini QA Console](https://chakn005.github.io/DeltaGemini/) pattern, but focused on **implementation status roll-up** (not QA test matrices).

## What leadership sees

| Level | View |
|-------|------|
| **Program** | Overall % complete, phase count, Jira items done |
| **Epic** | CPTR-72227 status from Jira |
| **Phases** | 6 delivery phases (CPM → Rights → Avail → AMP → AV → DTC) |
| **Systems** | CPM, Rightsline, Falcon, DTC UA, Catalog, SIP, AMP, Content Portal, DTC |
| **Work items** | Stories/tasks under the epic (after Jira sync) |

Tabs: **Executive Dashboard**, **Status Hierarchy**, **Architecture**, **Implementation Flow**, **Program Brief** (reference diagrams included).

## Local preview

```bash
cd "1st Party Unification"
python3 -m http.server 8080
# Open http://localhost:8080
```

## Sync from Jira (Disney VPN required)

```bash
cp .env.example .env   # add JIRA_TOKEN
./scripts/local-sync.sh
```

Or reuse credentials from `POC/delta-gemini-console/.env` or `mcp-servers/jira-mcp-server/.env`.

The sync script pulls epic **CPTR-72227**, child issues (Epic Link / parent / linked), and maps them to phases/systems/workflow steps by summary keywords.

## GitHub Pages

1. Repo → **Settings** → **Pages** → Source: **GitHub Actions**
2. Push to `main` — workflow `.github/workflows/deploy-pages.yml` publishes the site root.

Add repository secret `JIRA_TOKEN` (and optional `JIRA_SERVER`) to run **Jira Epic Sync** manually from Actions when on a network that can reach `jira.disney.com`.

## Repository

https://github.com/chakn005/1st-Party-Unification-Acquisition
