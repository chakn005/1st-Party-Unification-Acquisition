function renderEvidencesTab() {
  const root = document.getElementById("evidences-panel");
  if (!root) return;

  const epic = ACQUISITION_DATA.epic || {};
  const wf = ACQUISITION_DATA.consolidatedWorkflow || ACQUISITION_DATA.workflowDiagram || {};
  const unassigned = ACQUISITION_DATA.relatedTestPlans || [];

  root.innerHTML = `
    <p class="section-sub">Test plans and design artifacts for epic ${jiraLink(epic.key, epic.key)}, organized by milestone.</p>
    <div id="evidence-milestone-sections"></div>
    ${
      unassigned.length
        ? `<h3 class="section-title">Unassigned epic test plans</h3>${renderEvidenceTable(unassigned)}`
        : ""
    }
    <h3 class="section-title">Design &amp; architecture artifacts</h3>
    <div class="evidence-artifacts">
      <div class="evidence-artifact-card">
        <h4>Target architecture</h4>
        <p class="artifact-meta">Rights &amp; avails · Assets/media · S3 · Unified Acquisition · DTC</p>
        <a href="${acqPrefix()}assets/architecture-reference.png" target="_blank" rel="noopener">Open full diagram</a>
        <img class="ref-diagram" src="${acqPrefix()}assets/architecture-reference.png" alt="Architecture reference" loading="lazy">
      </div>
      <div class="evidence-artifact-card">
        <h4>Implementation swimlane</h4>
        <p class="artifact-meta">CPM → Rightsline → Falcon → DTC UA → Catalog → SIP → AMP → DTC</p>
        <a href="${acqPrefix()}assets/swimlane-reference.png" target="_blank" rel="noopener">Open full diagram</a>
        <img class="ref-diagram" src="${acqPrefix()}assets/swimlane-reference.png" alt="Swimlane reference" loading="lazy">
      </div>
    </div>
  `;

  const msRoot = document.getElementById("evidence-milestone-sections");
  if (msRoot) {
    ["milestone1", "milestone2", "amp"].forEach((id) => {
      const ms = milestoneById(id);
      if (!ms) return;
      const plans = plansForMilestone(id);
      const block = document.createElement("section");
      block.className = "milestone-section milestone-section-compact";
      block.innerHTML = `
        <header class="milestone-section-head">
          <h2 class="milestone-section-title">${escapeHtml(ms.name)} — Evidence</h2>
        </header>
        <div class="evidence-grid">${plans
          .map(
            (p) => `<article class="evidence-card">
              <h4>${jiraLink(p.id, p.name || p.id)}</h4>
              <p class="evidence-meta">${escapeHtml(p.jiraStatus)} · ${statusBadge(planExecutionStatus(p))} · ${p.coverage}%</p>
              ${renderExecBar(p)}
              <a class="evidence-open" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Open in Jira →</a>
            </article>`
          )
          .join("")}</div>`;
      msRoot.appendChild(block);
    });
  }

}

function renderEvidenceTable(plans) {
  return `<div class="related-table-wrap"><table class="related-table">
    <thead><tr><th>Test plan</th><th>Jira</th><th>Execution</th><th>Coverage</th><th>Pass / Total</th><th>Owner</th></tr></thead>
    <tbody>${plans
      .map(
        (p) => `<tr>
        <td>${jiraLink(p.id, p.shortName || p.id)}</td>
        <td>${escapeHtml(p.jiraStatus)}</td>
        <td>${statusBadge(planExecutionStatus(p))}</td>
        <td>${p.coverage ?? 0}%</td>
        <td>${p.pass ?? 0} / ${p.total ?? 0}</td>
        <td>${escapeHtml(p.assignee || "—")}</td>
      </tr>`
      )
      .join("")}</tbody></table></div>`;
}
