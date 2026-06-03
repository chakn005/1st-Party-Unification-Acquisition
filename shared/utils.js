function acqPrefix() {
  return window.ACQ_PREFIX || "";
}

function initTabs() {
  const tabBar = document.getElementById("tabs");
  const app = document.getElementById("app");
  if (!tabBar || !app) return;

  const tabs = tabBar.querySelectorAll("[data-tab]");
  const panels = app.querySelectorAll("[data-panel]");

  function activate(id) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === id));
    panels.forEach((p) => p.classList.toggle("active", p.dataset.panel === id));
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      activate(tab.dataset.tab);
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
  return ACQUISITION_DATA.statusLabels?.[status]?.label || "Not Started";
}

function statusClass(status) {
  return ACQUISITION_DATA.statusLabels?.[status]?.class || "status-pending";
}

function statusBadge(status) {
  return `<span class="st-badge ${statusClass(status)}">${escapeHtml(statusLabel(status))}</span>`;
}

/** Execution state for badges and status bars. */
function planExecutionStatus(plan) {
  if (!plan) return "pending";
  const jira = String(plan.jiraStatus || "").trim().toLowerCase();
  if ((plan.fail || 0) > 0) return "fail";
  if (["blocked", "impediment", "on hold"].includes(jira)) return "blocked";
  if (["done", "closed", "resolved", "complete", "completed"].includes(jira)) return "completed";
  if (["to do", "open", "new", "backlog", "not started", "todo"].includes(jira) && !(plan.pass)) {
    return "pending";
  }
  return "in-progress";
}

function execBarTone(status) {
  if (status === "completed") return "completed";
  if (status === "blocked" || status === "fail") return "blocked";
  return "in-progress";
}

function renderExecBar(plan) {
  const status = planExecutionStatus(plan);
  const tone = execBarTone(status);
  const total = plan?.total || 0;
  const pass = plan?.pass || 0;
  const fail = plan?.fail || 0;
  const pending = plan?.pending ?? Math.max(0, total - pass - fail - (plan?.blocked || 0));

  let width = 0;
  if (tone === "completed" || tone === "blocked") {
    width = 100;
  } else if (total) {
    width = Math.max(4, Math.round((pass / total) * 100));
  } else {
    width = 4;
  }

  return `<div class="exec-bar exec-bar--${tone}" title="Pass ${pass} · Not run ${pending} · Fail ${fail}">
    <div class="exec-bar-fill" style="width:${width}%"></div>
  </div>`;
}
