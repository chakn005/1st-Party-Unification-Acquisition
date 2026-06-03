function initTabs(root) {
  const tabs = root.querySelectorAll("[data-tab]");
  const panels = root.querySelectorAll("[data-panel]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      panels.forEach((p) => p.classList.toggle("active", p.dataset.panel === id));
    });
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusLabel(status) {
  return ACQUISITION_DATA.statusLabels[status]?.label || "Not Started";
}

function statusClass(status) {
  return ACQUISITION_DATA.statusLabels[status]?.class || "status-pending";
}

function statusBadge(status) {
  return `<span class="st-badge ${statusClass(status)}">${escapeHtml(statusLabel(status))}</span>`;
}

function phaseById(id) {
  return ACQUISITION_DATA.phases.find((p) => p.id === id);
}

function systemById(id) {
  return ACQUISITION_DATA.systems.find((s) => s.id === id);
}

function workflowStepById(id) {
  return ACQUISITION_DATA.workflowSteps.find((s) => s.id === id);
}

function archNodeById(id) {
  return ACQUISITION_DATA.architectureNodes.find((n) => n.id === id);
}
