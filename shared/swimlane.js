const SWIMLANE_SYSTEMS = [
  "cpm",
  "rightsline",
  "falcon",
  "dtc-ua",
  "dtc-catalog",
  "sip",
  "amp",
];

function renderSwimlane() {
  const root = document.getElementById("swimlane-board");
  const detail = document.getElementById("swimlane-detail");
  if (!root) return;

  let html = '<div class="swimlane-grid">';
  SWIMLANE_SYSTEMS.forEach((sysId) => {
    const sys = systemById(sysId);
    const steps = ACQUISITION_DATA.workflowSteps
      .filter((s) => s.system === sysId)
      .sort((a, b) => a.order - b.order);
    html += `<div class="swimlane-row">
      <div class="swimlane-label">${escapeHtml(sys?.name || sysId)}<br><span style="font-weight:400;color:var(--muted)">${escapeHtml(sys?.short || "")}</span></div>
      <div class="swimlane-steps">${steps.map((step) => `
        <div class="wf-step-card" data-step="${step.id}">
          <div class="order">#${step.order}</div>
          <h4>${escapeHtml(step.name)}</h4>
          ${statusBadge(step.status || "pending")}
        </div>`).join("")}</div>
    </div>`;
  });
  html += "</div>";
  root.innerHTML = html;

  root.querySelectorAll(".wf-step-card").forEach((card) => {
    card.addEventListener("click", () => {
      root.querySelectorAll(".wf-step-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      const step = workflowStepById(card.dataset.step);
      const phase = phaseById(step.phase);
      const linked = workItemsForStep(step.id);
      detail.innerHTML = `
        <h3>Step ${step.order}: ${escapeHtml(step.name)}</h3>
        <p>${escapeHtml(step.summary)}</p>
        <p style="margin-top:0.5rem">Phase: <strong>${escapeHtml(phase?.name || step.phase)}</strong> · System: <strong>${escapeHtml(systemById(step.system)?.name || step.system)}</strong></p>
        <p style="margin-top:0.5rem">${statusBadge(step.status || "pending")} ${step.progress != null ? `· ${step.progress}% of linked work complete` : ""}</p>
        <h4 style="margin-top:1rem;font-size:0.85rem">Linked Jira</h4>
        ${linked.length ? `<ul>${linked.map((w) => `<li>${jiraLink(w.key, w.key)} — ${escapeHtml(w.summary)} (${escapeHtml(w.jiraStatus)})</li>`).join("")}</ul>` : "<p style=\"color:var(--muted)\">No Jira items mapped to this step yet.</p>"}`;
    });
  });

  if (detail && !detail.innerHTML) {
    detail.innerHTML = "<p style=\"color:var(--muted)\">Select a workflow step to view implementation detail and Jira links.</p>";
  }
}
