# 1st Party Unification Acquisition Console

Leadership view of **epic [CPTR-72227](https://jira.disney.com/browse/CPTR-72227)** with QA status segregated by:

| Milestone | Test plan | Focus |
|-----------|-----------|--------|
| **Milestone 1** | [DMEDNINJA-17790](https://jira.disney.com/browse/DMEDNINJA-17790) | SIP — partner, rights, avail, S3 ingest |
| **Milestone 2** | [DMEDNINJA-17818](https://jira.disney.com/browse/DMEDNINJA-17818) | SIP — AV delivery, catalog, DTC |
| **AMP** | [OMFG-19970](https://jira.disney.com/browse/OMFG-19970) | AMP order & SIP delivery to unified acquisition |

**Tabs:** **Overview** · **Milestone 1** · **Milestone 2** · **E2E Acquisition Pipeline** · **QA Evidence & Traceability**. Disney enterprise theme.

## Local preview

```bash
./scripts/serve-local.sh
# http://localhost:8080/
```

## Sync from Jira (VPN)

```bash
cp .env.example .env   # JIRA_TOKEN
./scripts/local-sync.sh
```

Pulls epic status, Xray stats for six test plans (three SIP/AMP primaries plus epic-linked RIGHTS-* plans).

## GitHub Pages

**URL:** https://chakn005.github.io/1st-Party-Unification-Acquisition/

(Use that exact link, including trailing slash. Hard-refresh if you previously saw a 404.)

**Pages setup:** Settings → Pages → **Deploy from a branch** → **gh-pages** / **(root)**.  
The [Deploy GitHub Pages](https://github.com/chakn005/1st-Party-Unification-Acquisition/actions/workflows/deploy-pages.yml) workflow updates `gh-pages` on each push to `main`.

Repository: https://github.com/chakn005/1st-Party-Unification-Acquisition

## Cursor agent skill

This repo includes a project skill at [`.cursor/skills/acquisition-console/SKILL.md`](.cursor/skills/acquisition-console/SKILL.md). It teaches the Cursor agent how this console works — Jira sync, tab layout, deploy rules, and file map — so you do not have to re-explain the project each session.

**How to use it:** ask in natural language, or say *“follow the acquisition-console skill”* to be explicit. The agent reads `SKILL.md` (and [`reference.md`](.cursor/skills/acquisition-console/reference.md) when needed) and follows those workflows.

### What you can ask

#### Jira sync & data

| Ask for… | Example prompt |
|----------|----------------|
| Refresh live numbers from Jira | “Run Jira sync for CPTR-72227 on VPN and update `data.json`” |
| Explain coverage / rollup | “How is program coverage calculated in this console?” |
| Add a new linked test plan | “Add RIGHTS-XXXXX to Milestone 2 sync in `sync-from-jira.py`” |
| Wire Xray heatmap data | “Map CPTR-72676 test cases to the Overview heatmap columns” |
| Commit synced data | “Commit and push the latest Jira sync” |

#### Overview tab

| Ask for… | Example prompt |
|----------|----------------|
| Change heatmap columns | “Remove/add a column on the Overview heatmap” |
| Status & sharing | “Make heatmap status cycle like Content_flow and add share links” |
| M1 cross-alliance mapping | “Update how CPTR-72676 tests map to alliance × column cells” |
| KPIs / layout | “Update Overview KPIs or the share bar copy” |

Overview heatmaps use **Copy share link** (`?updated=…&s=…` in the URL) so leaders opening a shared link see the latest status snapshot — same pattern as the [Cross‑Alliance E2E console](https://chakn005.github.io/Content_flow_Integration/).

#### Milestone 1 & 2 tabs

| Ask for… | Example prompt |
|----------|----------------|
| UI changes | “Change how Milestone 1 shows DMEDNINJA-17790 test results” |
| M2 pipeline sections | “Update FDA / Falcon / RMS-MD sections on Milestone 2” |
| Status badges | “Fix execution badge logic for a test plan” |
| Linked plans | “Show OMFG-19970 AMP stats differently on Milestone 2” |

#### E2E Acquisition Pipeline tab

| Ask for… | Example prompt |
|----------|----------------|
| Reorder diagram | “Move S3 (Content) before DTC on the top pipeline row” |
| Add/remove nodes | “Add a node to the architecture swimlane diagram” |
| Delta Gemini link | “Keep Delta Gemini link only on Pipeline tab, not the header” |
| Styling | “Adjust workflow diagram colors or hover tooltips” |

#### QA Evidence & Traceability tab

| Ask for… | Example prompt |
|----------|----------------|
| Grouping / layout | “Regroup evidence by milestone or alliance” |
| Jira links | “Add links to a new test plan on the Evidence tab” |
| Reference diagrams | “Update reference diagram section on Evidence tab” |

#### Local dev & previews

| Command / ask | Details |
|---------------|---------|
| `./scripts/serve-local.sh` | Production console on port **8080** |
| `./scripts/serve-overview-options.sh` | Overview layout previews on port **8891** (local only) |
| `./scripts/serve-delta-gemini-options.sh` | Delta Gemini integration previews (local only) |
| Example prompt | “Start the local server on port 8080” or “Port 8080 is stuck — help me kill the process” |

Hard-refresh the browser after changes. Local-only folders (`overview-options/`, `delta-gemini-options/`) are excluded from GitHub Pages deploy.

#### Deploy & GitHub Pages

| Ask for… | Example prompt |
|----------|----------------|
| Push to live | “Commit and push to main so GitHub Pages updates” |
| Deploy workflow | “How does deploy-pages.yml work for this repo?” |
| What gets excluded | “Will overview-options deploy to production?” |
| Pull request | “Create a PR with these console changes” |

Push to `main` triggers auto-deploy to `gh-pages` (~1–2 min). Hard-refresh the live site after deploy.

#### UI / theme / conventions

| Ask for… | Example prompt |
|----------|----------------|
| Disney theme | “Match existing disney-theme.css styling for a new section” |
| Jira footer | “Update the footer last-synced timestamp display” |
| Status colors | “Use the same pending/in-progress/completed badges as other tabs” |
| Minimal diff | “Change only what’s needed — no React, no build step” |

#### Security

| Ask for… | Example prompt |
|----------|----------------|
| Safe token setup | “Set up `.env` for Jira sync without committing secrets” |
| Review before commit | “Check this diff doesn’t expose JIRA_TOKEN or PII” |

Never commit `.env` or tokens. The browser never calls Jira — sync is batch-only via `./scripts/local-sync.sh`.

#### Exploratory

| Ask for… | Example prompt |
|----------|----------------|
| Architecture | “Explain how this console loads data and renders tabs” |
| File map | “Which file should I edit to change X?” |
| Data model | “What’s in `ACQUISITION_DATA` after sync?” |
| Epic mapping | “Which Jira plans map to Milestone 1 vs 2?” |

### Prompt patterns that work well

**Specific task**

> Using acquisition-console skill: sync Jira, then update Overview heatmap for Media Platform AV Assets.

**Constrained change**

> Only edit `shared/workflow-diagram.js` — reorder bottom row to Rightsline → Falcon → Avails.

**Deploy end-to-end**

> Sync from Jira on VPN, commit data files, push to main for leaders.

**Compare with another site**

> Make heatmap sharing work like Content_flow_Integration.

### Limits (by design)

- No live Jira calls from the browser — sync is Python batch-only on VPN
- No React/npm build — vanilla HTML, CSS, and JavaScript
- Local preview folders are not deployed to GitHub Pages
- See the skill file for production tab conventions and files to avoid changing without intent

