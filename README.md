# 1st Party Unification Acquisition Console

Leadership view of **epic [CPTR-72227](https://jira.disney.com/browse/CPTR-72227)** with QA status segregated by:

| Milestone | Test plan | Focus |
|-----------|-----------|--------|
| **Milestone 1** | [DMEDNINJA-17790](https://jira.disney.com/browse/DMEDNINJA-17790) | SIP — partner, rights, avail, S3 ingest |
| **Milestone 2** | [DMEDNINJA-17818](https://jira.disney.com/browse/DMEDNINJA-17818) | SIP — AV delivery, catalog, DTC |
| **AMP** | [OMFG-19970](https://jira.disney.com/browse/OMFG-19970) | AMP order & SIP delivery to unified acquisition |

**Tabs:** **Milestone 1** · **Milestone 2** · **E2E Acquisition Pipeline** · **QA Evidence & Traceability**. Disney enterprise theme.

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

One-time setup (required or the site stays 404):

1. Push to `main` (workflow publishes the `gh-pages` branch)
2. Open [Repository Settings → Pages](https://github.com/chakn005/1st-Party-Unification-Acquisition/settings/pages)
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**
4. Branch: **gh-pages** · Folder: **/ (root)** · Save
5. Wait 1–2 minutes, then open the URL above

Repository: https://github.com/chakn005/1st-Party-Unification-Acquisition
