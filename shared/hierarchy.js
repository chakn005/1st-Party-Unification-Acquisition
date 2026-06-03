function renderHierarchy() {
  const el = document.getElementById("hierarchy-table");
  if (!el) return;

  const epic = ACQUISITION_DATA.epicIssue || {};
  const rollup = ACQUISITION_DATA.programRollup || {};
  const rows = [];

  rows.push({
    level: "Program",
    name: ACQUISITION_DATA.program,
    key: epic.key,
    status: rollup.status || epic.status,
    progress: `${rollup.progress ?? 0}%`,
    indent: 0,
  });

  rows.push({
    level: "Epic",
    name: epic.summary || epic.key,
    key: epic.key,
    status: epic.status,
    progress: epic.jiraStatus || "—",
    indent: 1,
  });

  ACQUISITION_DATA.phases
    .sort((a, b) => a.order - b.order)
    .forEach((phase) => {
      rows.push({
        level: "Phase",
        name: phase.name,
        key: "",
        status: phase.status,
        progress: `${phase.progress || 0}%`,
        indent: 1,
      });
      ACQUISITION_DATA.systems
        .filter((s) => s.phase === phase.id)
        .forEach((sys) => {
          rows.push({
            level: "System",
            name: sys.name,
            key: "",
            status: sys.status,
            progress: `${sys.progress || 0}%`,
            indent: 2,
          });
        });
    });

  const workItems = ACQUISITION_DATA.workItems || [];
  if (workItems.length) {
    workItems.forEach((w) => {
      rows.push({
        level: w.issueType || "Story",
        name: w.summary,
        key: w.key,
        status: w.status,
        progress: w.jiraStatus,
        indent: 2,
      });
    });
  } else {
    rows.push({
      level: "Work items",
      name: "Sync Jira to load stories under CPTR-72227",
      key: "",
      status: "pending",
      progress: "—",
      indent: 2,
    });
  }

  el.innerHTML = `<table>
    <thead><tr><th>Level</th><th>Name</th><th>Key</th><th>Status</th><th>Progress / Jira</th></tr></thead>
    <tbody>${rows.map((r) => `<tr>
      <td>${escapeHtml(r.level)}</td>
      <td class="indent-${r.indent}">${escapeHtml(r.name)}</td>
      <td>${r.key ? jiraLink(r.key, r.key) : "—"}</td>
      <td>${statusBadge(r.status || "pending")}</td>
      <td>${escapeHtml(String(r.progress))}</td>
    </tr>`).join("")}</tbody>
  </table>`;
}

function renderBrief() {
  const el = document.getElementById("brief-panel");
  const b = ACQUISITION_DATA.brief || {};
  if (!el) return;
  el.innerHTML = `
    <div class="brief-grid">
      <div class="brief-card"><h3>Vision</h3><p style="color:var(--muted)">${escapeHtml(b.vision || "")}</p></div>
      <div class="brief-card"><h3>Scope</h3><ul>${(b.scope || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul></div>
      <div class="brief-card"><h3>Key identifiers</h3><p>${(b.keyIdentifiers || []).map((k) => `<code style="margin-right:0.35rem">${escapeHtml(k)}</code>`).join("")}</p></div>
      <div class="brief-card"><h3>Risks</h3><ul>${(b.risks || []).map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul></div>
      <div class="brief-card"><h3>Reference diagrams</h3>
        <p><a href="assets/architecture-reference.png" target="_blank" rel="noopener">Architecture (source → DTC)</a></p>
        <img class="ref-diagram" src="assets/architecture-reference.png" alt="1st Party Unification architecture diagram" loading="lazy">
        <p style="margin-top:1rem"><a href="assets/swimlane-reference.png" target="_blank" rel="noopener">Implementation swimlane</a></p>
        <img class="ref-diagram" src="assets/swimlane-reference.png" alt="Implementation swimlane workflow" loading="lazy">
      </div>
    </div>`;
}
