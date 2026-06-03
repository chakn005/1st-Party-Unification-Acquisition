function renderSyncBanner() {
  const el = document.getElementById("sync-banner");
  if (!el) return;
  if (ACQUISITION_DATA.jira?.syncRequired && !ACQUISITION_DATA.jira?.lastSynced) {
    el.innerHTML = `<strong>Jira data not loaded.</strong> On corporate VPN, run <code>pip install -r requirements-sync.txt && python scripts/sync-from-jira.py</code> to pull epic <code>${escapeHtml(ACQUISITION_DATA.epic)}</code> and child work items.`;
    el.style.display = "block";
  } else {
    el.style.display = "none";
  }
}

function renderExecutiveKpis() {
  const r = ACQUISITION_DATA.programRollup || {};
  const epic = ACQUISITION_DATA.epicIssue || {};
  const el = document.getElementById("exec-kpis");
  if (!el) return;
  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><div class="val">${r.progress ?? 0}%</div><div class="lbl">Program progress</div></div>
      <div class="kpi-card"><div class="val">${r.phasesComplete ?? 0}/${r.phaseTotal ?? 6}</div><div class="lbl">Phases complete</div></div>
      <div class="kpi-card"><div class="val">${r.workDone ?? 0}/${r.workTotal ?? 0}</div><div class="lbl">Jira items done</div></div>
      <div class="kpi-card"><div class="val">${statusBadge(r.status || epic.status || "pending")}</div><div class="lbl">Overall status</div></div>
    </div>`;
}

function renderPhaseCards(selectedId) {
  const grid = document.getElementById("phase-grid");
  if (!grid) return;
  grid.innerHTML = ACQUISITION_DATA.phases
    .sort((a, b) => a.order - b.order)
    .map((phase) => {
      const sel = phase.id === selectedId ? " selected" : "";
      return `<article class="phase-card${sel}" data-phase="${phase.id}">
        <h3>${escapeHtml(phase.name)}</h3>
        <div class="phase-meta">Phase ${phase.order} · ${phase.stepCount || 0} workflow steps</div>
        ${statusBadge(phase.status || "pending")}
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${phase.progress || 0}%"></div></div>
        <div class="phase-meta">${phase.progress || 0}% complete</div>
        <p style="font-size:0.82rem;color:var(--muted);margin-top:0.5rem">${escapeHtml(phase.summary)}</p>
      </article>`;
    })
    .join("");

  grid.querySelectorAll(".phase-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.phase;
      renderPhaseCards(id);
      renderPhaseDetail(id);
      renderSystemStatusForPhase(id);
    });
  });
}

function renderPhaseDetail(phaseId) {
  const drawer = document.getElementById("phase-detail");
  if (!drawer) return;
  if (!phaseId) {
    drawer.innerHTML = "<p style=\"color:var(--muted)\">Select a phase to see workflow steps and linked Jira work.</p>";
    return;
  }
  const phase = phaseById(phaseId);
  const steps = ACQUISITION_DATA.workflowSteps.filter((s) => s.phase === phaseId).sort((a, b) => a.order - b.order);
  const items = workItemsForPhase(phaseId);
  drawer.innerHTML = `
    <h3>${escapeHtml(phase.name)} — ${statusBadge(phase.status)}</h3>
    <p style="color:var(--muted);font-size:0.9rem">${escapeHtml(phase.summary)}</p>
    <h4 style="margin:1rem 0 0.5rem;font-size:0.85rem;color:var(--brand-primary)">Workflow steps (${steps.length})</h4>
    <ul>${steps.map((s) => `<li><strong>${escapeHtml(s.name)}</strong> — ${statusBadge(s.status || "pending")} ${s.progress ? `(${s.progress}%)` : ""}</li>`).join("")}</ul>
    <h4 style="margin:1rem 0 0.5rem;font-size:0.85rem;color:var(--brand-primary)">Linked Jira (${items.length})</h4>
    ${items.length ? `<ul>${items.map((w) => `<li>${jiraLink(w.key, w.key)} ${escapeHtml(w.summary)} — ${statusBadge(w.status)}</li>`).join("")}</ul>` : "<p style=\"color:var(--muted);font-size:0.88rem\">No mapped work items yet. Sync from Jira or add mappings in data.json.</p>"}`;
}

function renderSystemStatusForPhase(phaseId) {
  const el = document.getElementById("system-status");
  if (!el) return;
  const phase = phaseById(phaseId);
  if (!phase) {
    el.innerHTML = "";
    return;
  }
  const systems = (phase.systems || []).map((id) => systemById(id)).filter(Boolean);
  el.innerHTML = `
    <h2>Level 2 — Systems <span class="level-sub" style="font-weight:400">within ${escapeHtml(phase.name)}</span></h2>
    <div class="phase-grid">${systems.map((sys) => `
      <div class="phase-card" style="cursor:default">
        <h3>${escapeHtml(sys.name)}</h3>
        <div class="phase-meta">${escapeHtml(sys.short)}</div>
        ${statusBadge(sys.status || "pending")}
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${sys.progress || 0}%"></div></div>
      </div>`).join("")}</div>`;
}

function renderEpicHeader() {
  const epic = ACQUISITION_DATA.epicIssue || {};
  const meta = document.getElementById("header-meta");
  if (meta) {
    meta.innerHTML = `Program: ${escapeHtml(ACQUISITION_DATA.program)} · Epic ${jiraLink(epic.key || ACQUISITION_DATA.epic, epic.key || ACQUISITION_DATA.epic)} · ${statusBadge(epic.status || "pending")} · Jira: ${escapeHtml(epic.jiraStatus || "—")}`;
  }
}

function initDashboard() {
  enrichRollups();
  renderSyncBanner();
  renderEpicHeader();
  renderExecutiveKpis();
  renderPhaseCards(null);
  renderPhaseDetail(null);
}
