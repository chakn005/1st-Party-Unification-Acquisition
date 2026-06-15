/* Overview tab — Program heatmaps (Option A, production) */

const OV_STATUS_CYCLE = ["pending", "in-progress", "completed", "risk"];
const OV_STATUS_LABELS = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
  risk: "Risk",
};
const OV_LS_PREFIX = "acq-heatmap-status:";

function ovPrograms() {
  return ACQUISITION_DATA.programHeatmaps || [];
}

function ovAlliances(program) {
  return program.alliances || [];
}

function ovStorageKey(programId, allianceId, colId) {
  return `${OV_LS_PREFIX}${programId}:${allianceId}:${colId}`;
}

function ovEffectiveStatus(programId, allianceId, colId, syncedStatus) {
  try {
    const saved = localStorage.getItem(ovStorageKey(programId, allianceId, colId));
    if (saved && OV_STATUS_CYCLE.includes(saved)) return saved;
  } catch {
    /* localStorage unavailable */
  }
  return syncedStatus || "pending";
}

function ovSetStatus(programId, allianceId, colId, status) {
  try {
    localStorage.setItem(ovStorageKey(programId, allianceId, colId), status);
  } catch {
    /* ignore */
  }
}

function ovNextStatus(current) {
  const i = OV_STATUS_CYCLE.indexOf(current);
  return OV_STATUS_CYCLE[(i + 1) % OV_STATUS_CYCLE.length];
}

function ovStatusClass(status) {
  if (status === "in-progress") return "in-progress";
  if (status === "completed") return "completed";
  if (status === "risk") return "risk";
  return "pending";
}

function ovProgramKpis() {
  const programs = ovPrograms().filter((p) => p.available && p.cells);
  const cells = programs.flatMap((p) =>
    ovAlliances(p).flatMap((a) =>
      (p.columns || []).map((c) =>
        ovEffectiveStatus(p.id, a.id, c.id, p.cells[a.id]?.[c.id]?.status)
      )
    )
  );
  const counts = { pending: 0, "in-progress": 0, completed: 0, risk: 0 };
  cells.forEach((s) => {
    if (counts[s] !== undefined) counts[s] += 1;
  });
  return `<div class="kpi-row ov-kpi-row">
    <div class="kpi"><div class="v">${programs.length}</div><div class="l">Active heatmaps</div></div>
    <div class="kpi"><div class="v">${counts["in-progress"]}</div><div class="l">In progress</div></div>
    <div class="kpi"><div class="v">${counts.completed}</div><div class="l">Completed</div></div>
    <div class="kpi"><div class="v">${counts.pending}</div><div class="l">Pending</div></div>
    <div class="kpi"><div class="v">${counts.risk}</div><div class="l">At risk</div></div>
  </div>`;
}

function ovProgramHeatmapHeader(program) {
  const jiraMeta = program.jiraKey
    ? `${jiraLink(program.jiraKey, program.jiraKey, "ov-jira-epic-link")} · Jira: <strong>${escapeHtml(program.jiraStatus || "—")}</strong>`
    : `<span class="ov-program-tbd-badge">Test plan TBD</span>`;
  const execMeta =
    program.testExecutions?.length
      ? `<span class="ov-mapped-count">${program.testExecutions.length} test execution(s) · ${program.testsMapped ?? 0} test case(s) mapped</span>`
      : program.testsMapped != null
        ? `<span class="ov-mapped-count">${program.testsMapped} test case(s) mapped</span>`
        : "";
  const execLinks = (program.testExecutions || [])
    .map((ex) => jiraLink(ex.key, ex.key))
    .join(" · ");
  return `<header class="ov-program-heatmap-head">
    <div>
      <h3 class="ov-program-heatmap-title">${escapeHtml(program.title)}</h3>
      <p class="ov-program-heatmap-sub">${escapeHtml(program.subtitle || "")}</p>
      ${execLinks ? `<p class="ov-program-heatmap-sub">Executions: ${execLinks}</p>` : ""}
    </div>
    <div class="ov-program-heatmap-meta">${jiraMeta}${execMeta ? `<br>${execMeta}` : ""}</div>
  </header>`;
}

function ovStatusCell(program, alliance, col, cellData) {
  const synced = cellData?.status || "pending";
  const status = ovEffectiveStatus(program.id, alliance.id, col.id, synced);
  const cls = ovStatusClass(status);
  const label = OV_STATUS_LABELS[status];
  const testsHint =
    cellData?.total > 0
      ? ` · ${cellData.pass ?? 0}/${cellData.total} test(s) from Xray`
      : "";
  const jiraHint = cellData?.testKeys?.length
    ? ` · ${cellData.testKeys.join(", ")}`
    : cellData?.jiraKey
      ? ` · ${cellData.jiraKey}`
      : "";
  const title = `${alliance.name} · ${col.label}: ${label}${testsHint}${jiraHint}. Click to change status.`;
  const sub =
    cellData?.total > 0
      ? `<span class="ov-heat-sub">${cellData.pass ?? 0}/${cellData.total} tests</span>`
      : cellData?.jiraKey
        ? `<span class="ov-heat-sub">${escapeHtml(cellData.jiraKey)}</span>`
        : "";
  return `<td class="matrix-cell ${cls} ov-status-cell ov-heat-cell"
    role="button"
    tabindex="0"
    data-program="${escapeHtml(program.id)}"
    data-alliance="${escapeHtml(alliance.id)}"
    data-col="${escapeHtml(col.id)}"
    data-status="${escapeHtml(status)}"
    title="${escapeHtml(title)}">
    <span class="ov-status-label">${escapeHtml(label)}</span>
    ${sub}
  </td>`;
}

function ovSingleProgramHeatmap(program) {
  if (!program.available) {
    const head = (program.columns || [])
      .map((c) => `<th>${escapeHtml(c.short || c.label)}</th>`)
      .join("");
    const tbdRow = (program.alliances || [])
      .map(
        (a) => `<tr><th scope="row" class="ov-row-head">${escapeHtml(a.name)}</th>${(program.columns || [])
          .map(() => `<td class="matrix-cell pending ov-status-cell ov-heat-cell--tbd"><span class="ov-status-label">TBD</span></td>`)
          .join("")}</tr>`
      )
      .join("");
    return `<section class="ov-program-heatmap-section ov-program-heatmap-section--tbd">
      ${ovProgramHeatmapHeader(program)}
      <p class="ov-program-heatmap-placeholder">${escapeHtml(program.placeholderMessage || "Not yet available.")}</p>
      <div class="matrix-wrap ov-matrix-wrap">
        <table class="matrix ov-matrix"><thead><tr><th>Alliance</th>${head}</tr></thead><tbody>${tbdRow}</tbody></table>
      </div>
    </section>`;
  }

  const head = (program.columns || [])
    .map(
      (c) =>
        `<th title="${escapeHtml(c.label)}">${escapeHtml(c.short || c.label)}</th>`
    )
    .join("");

  const rows = ovAlliances(program)
    .map((a) => {
      const cells = (program.columns || [])
        .map((c) => ovStatusCell(program, a, c, program.cells?.[a.id]?.[c.id]))
        .join("");
      return `<tr><th scope="row" class="ov-row-head"><span class="ov-alliance-dot" style="background:${a.color}"></span>${escapeHtml(a.name)}</th>${cells}</tr>`;
    })
    .join("");

  return `<section class="ov-program-heatmap-section" aria-label="${escapeHtml(program.title)}">
    ${ovProgramHeatmapHeader(program)}
    <div class="matrix-wrap ov-matrix-wrap">
      <table class="matrix ov-matrix ov-program-matrix" role="grid">
        <thead><tr><th scope="col">Alliance</th>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="matrix-note ov-matrix-note">Status from Xray test execution results (TODO → Pending, EXECUTING → In Progress, PASS → Completed, FAIL → Risk). Click any cell to override locally. Re-sync refreshes base values from Jira.</p>
  </section>`;
}

function ovIntegrationCards() {
  const rollup = ACQUISITION_DATA.programRollup || {};
  const epic = ACQUISITION_DATA.epic || {};
  return `<div class="ov-cross-grid">
    <article class="ov-cross-card ov-cross-card--in-progress">
      <header class="ov-cross-card-head">
        <h3>Epic QA rollup</h3>
        <span class="st-badge status-progress">In progress</span>
      </header>
      <p class="ov-cross-focus">${escapeHtml(epic.summary || epic.key || "CPTR-72227")}</p>
      <div class="ov-cross-stats"><strong>${rollup.coverage ?? 0}%</strong> coverage · <strong>${rollup.pass ?? 0}/${rollup.total ?? 0}</strong> tests · ${rollup.planCount ?? 0} plan(s)</div>
    </article>
    <article class="ov-cross-card ov-cross-card--pending">
      <header class="ov-cross-card-head">
        <h3>Milestone 2 cross-alliance</h3>
        <span class="st-badge status-pending">Not started</span>
      </header>
      <p class="ov-cross-focus">Milestone 2 cross-alliance test plan not yet linked in Jira.</p>
    </article>
  </div>`;
}

function renderOverviewTab() {
  const root = document.getElementById("overview-panel");
  if (!root) return;

  const programs = ovPrograms();
  if (!programs.length) {
    root.innerHTML = `<p class="section-sub">Overview data not loaded — run <code>./scripts/local-sync.sh</code> on VPN.</p>`;
    return;
  }

  root.innerHTML = `
    ${ovProgramKpis()}
    <h2 class="section-title">Program heatmaps</h2>
    <p class="section-sub">Cross-alliance testing status by milestone. Milestone 1 syncs Xray test executions and test cases from ${jiraLink("CPTR-72676", "CPTR-72676", "ov-jira-epic-link")} (Test Plan).</p>
    ${programs.map((p) => ovSingleProgramHeatmap(p)).join("")}
    <h2 class="section-title">Cross-alliance integration testing</h2>
    <p class="section-sub">Program-level QA rollup from epic ${jiraLink(ACQUISITION_DATA.epic?.key || "CPTR-72227", ACQUISITION_DATA.epic?.key || "CPTR-72227")}.</p>
    ${ovIntegrationCards()}`;

  bindOverviewCellInteractions(root);
}

function bindOverviewCellInteractions(root) {
  root.querySelectorAll(".ov-status-cell[data-program]").forEach((el) => {
    const cycle = () => {
      const programId = el.dataset.program;
      const allianceId = el.dataset.alliance;
      const colId = el.dataset.col;
      const next = ovNextStatus(el.dataset.status);
      ovSetStatus(programId, allianceId, colId, next);
      el.dataset.status = next;
      el.className = `matrix-cell ${ovStatusClass(next)} ov-status-cell ov-heat-cell`;
      el.querySelector(".ov-status-label").textContent = OV_STATUS_LABELS[next];
    };
    el.addEventListener("click", cycle);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cycle();
      }
    });
  });
}
