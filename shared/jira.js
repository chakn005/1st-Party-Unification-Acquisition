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
  if (!ts) return "Not synced";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function renderJiraMetaFooter() {
  const plans = (ACQUISITION_DATA.milestones || [])
    .map((m) => m.testPlan?.id)
    .filter(Boolean)
    .map((id) => jiraLink(id, id))
    .join(" · ");
  return `Jira synced: ${escapeHtml(formatSyncTime())} · Epic ${jiraLink(ACQUISITION_DATA.epic?.key || "CPTR-72227")} · ${plans}`;
}
