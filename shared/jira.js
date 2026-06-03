function jiraBrowseUrl(issueKey) {
  const base = ACQUISITION_DATA?.jira?.baseUrl || "https://jira.disney.com";
  const path = ACQUISITION_DATA?.jira?.browsePath || "/browse/";
  return `${base.replace(/\/$/, "")}${path}${encodeURIComponent(issueKey)}`;
}

function jiraLink(issueKey, label, className) {
  const text = label || issueKey;
  const cls = className ? ` class="${className}"` : ' class="jira-link"';
  return `<a href="${escapeHtml(jiraBrowseUrl(issueKey))}"${cls} target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
}

function formatSyncTime() {
  const ts = ACQUISITION_DATA?.jira?.lastSynced;
  if (!ts) return "Not synced from Jira yet";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function renderJiraMetaFooter() {
  const epic = ACQUISITION_DATA.epicIssue?.key || ACQUISITION_DATA.epic;
  const items = ACQUISITION_DATA.workItems?.length
    ? `${ACQUISITION_DATA.workItems.length} work items`
    : "Run sync to load epic children";
  return `<div class="jira-meta-footer">Jira synced: ${escapeHtml(formatSyncTime())} · Epic ${jiraLink(epic, epic)} · ${escapeHtml(items)}</div>`;
}
