function milestoneById(id) {
  return (ACQUISITION_DATA.milestones || []).find((m) => m.id === id);
}

function renderPlanCard(plan, opts = {}) {
  if (!plan?.id) return "";
  const execSt = planExecutionStatus(plan);
  const primary = opts.primary ? " plan-card-primary" : "";
  return `<article class="plan-card${primary}">
    <p class="plan-card-id">${jiraLink(plan.id, plan.name || plan.id)}</p>
    <p class="plan-card-meta">
      Jira: <strong>${escapeHtml(plan.jiraStatus || "—")}</strong>
      · Execution: ${statusBadge(execSt)}
      · ${plan.coverage ?? 0}% coverage
    </p>
    ${renderExecBar(plan)}
    <div class="exec-stats">
      <span><strong>${plan.pass ?? 0}</strong> Passed</span>
      <span><strong>${plan.pending ?? 0}</strong> Not run</span>
      <span><strong>${plan.fail ?? 0}</strong> Failed</span>
      <span><strong>${plan.total ?? 0}</strong> Total</span>
    </div>
    ${plan.assignee ? `<p class="plan-card-owner">Owner: ${escapeHtml(plan.assignee)}</p>` : ""}
  </article>`;
}

function renderPlansTable(plans) {
  if (!plans?.length) {
    return "<p class=\"section-sub\" style=\"margin:0\">No additional test plans for this milestone.</p>";
  }
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

const M2_FDA_PLAN_KEY = "RIGHTS-28225";
const M2_DTCFALCON_PLAN_KEY = "RIGHTS-28094";
const M2_RMSMD_PLAN_KEY = "RIGHTS-28328";

function findPlanById(planId) {
  for (const ms of ACQUISITION_DATA.milestones || []) {
    if (ms.testPlan?.id === planId) return ms.testPlan;
    const linked = (ms.linkedTestPlans || []).find((p) => p.id === planId);
    if (linked) return linked;
  }
  return null;
}

function renderMilestoneSection(ms, opts = {}) {
  const plan = ms.testPlan || {};
  const linked = (ms.linkedTestPlans || []).filter(
    (p) => !(opts.excludeLinkedIds || []).includes(p.id)
  );
  const allPlans = [plan, ...linked].filter((p) => p?.id);
  const totalTests = allPlans.reduce((s, p) => s + (p.total || 0), 0);
  const passTests = allPlans.reduce((s, p) => s + (p.pass || 0), 0);
  const idAttr = opts.omitId ? "" : ` id="section-${escapeHtml(ms.id)}"`;
  const hideLinked = opts.hideLinked || opts.sipOnly;

  return `<section class="milestone-section" data-milestone="${escapeHtml(ms.id)}"${idAttr}>
    <header class="milestone-section-head">
      <div>
        <h2 class="milestone-section-title">${escapeHtml(ms.name)}</h2>
        <p class="milestone-section-sub">${escapeHtml(ms.subtitle || "")}</p>
      </div>
      <div class="milestone-section-stats">
        ${statusBadge(planExecutionStatus(plan))}
        <span class="milestone-rollup">${passTests}/${totalTests} tests passed · ${allPlans.length} plan(s)</span>
      </div>
    </header>

    <div class="plan-cards-row">${renderPlanCard(plan, { primary: true })}</div>
    ${hideLinked ? "" : renderPlansTable(linked)}
  </section>`;
}

function renderPipelinePlanSection(title, subtitle, plan) {
  if (!plan?.id) return "";
  const passTests = plan.pass || 0;
  const totalTests = plan.total || 0;
  return `<section class="milestone-section" data-pipeline-plan="${escapeHtml(plan.id)}">
    <header class="milestone-section-head">
      <div>
        <h2 class="milestone-section-title">${escapeHtml(title)}</h2>
        <p class="milestone-section-sub">${escapeHtml(subtitle)}</p>
      </div>
      <div class="milestone-section-stats">
        ${statusBadge(planExecutionStatus(plan))}
        <span class="milestone-rollup">${passTests}/${totalTests} tests passed · 1 plan</span>
      </div>
    </header>
    <div class="plan-cards-row">${renderPlanCard(plan, { primary: true })}</div>
  </section>`;
}

function renderMilestone2SipSection(ms, fdaPlan) {
  const sip = ms.testPlan || {};
  const plans = [sip, fdaPlan].filter((p) => p?.id);
  const totalTests = plans.reduce((s, p) => s + (p.total || 0), 0);
  const passTests = plans.reduce((s, p) => s + (p.pass || 0), 0);

  return `<section class="milestone-section" data-milestone="milestone2-sip">
    <header class="milestone-section-head">
      <div>
        <h2 class="milestone-section-title">${escapeHtml(ms.name)}</h2>
        <p class="milestone-section-sub">${escapeHtml(ms.subtitle || "")}</p>
      </div>
      <div class="milestone-section-stats">
        ${statusBadge(planExecutionStatus(sip))}
        <span class="milestone-rollup">${passTests}/${totalTests} tests passed · ${plans.length} plan(s)</span>
      </div>
    </header>
    <div class="plan-cards-row">${renderPlanCard(sip, { primary: true })}</div>
    ${fdaPlan?.id ? `<div class="plan-cards-row">${renderPlanCard(fdaPlan, { primary: true })}</div>` : ""}
  </section>`;
}

function renderMilestoneTabKpis(milestoneId, elementId) {
  renderMilestoneTabKpisForIds([milestoneId], elementId);
}

function renderMilestoneTabKpisForPlans(plans, elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const allPlans = (plans || []).filter((p) => p?.id);
  const primaryPlans = allPlans;
  const linked = [];
  const totalTests = allPlans.reduce((s, p) => s + (p.total || 0), 0);
  const passTests = allPlans.reduce((s, p) => s + (p.pass || 0), 0);
  const pendingTests = allPlans.reduce((s, p) => s + (p.pending || 0), 0);
  const avgCoverage =
    allPlans.length > 0
      ? Math.round(allPlans.reduce((s, p) => s + (p.coverage ?? 0), 0) / allPlans.length)
      : 0;
  const execStatuses = primaryPlans.map((p) => planExecutionStatus(p));
  const rollupExec = execStatuses.every((s) => s === "completed")
    ? "completed"
    : execStatuses.some((s) => s === "blocked" || s === "fail")
      ? "blocked"
      : execStatuses.some((s) => s === "in-progress")
        ? "in-progress"
        : "pending";

  el.innerHTML = `
    <div class="kpi"><div class="v">${avgCoverage}%</div><div class="l">Avg test coverage</div></div>
    <div class="kpi"><div class="v">${passTests}/${totalTests}</div><div class="l">Tests passed</div></div>
    <div class="kpi"><div class="v">${allPlans.length}</div><div class="l">Test plans</div></div>
    <div class="kpi"><div class="v">${pendingTests}</div><div class="l">Tests not run</div></div>
    <div class="kpi">${statusBadge(rollupExec)}<div class="l" style="margin-top:0.35rem">Execution status</div></div>`;
}

function renderMilestoneTabKpisForIds(milestoneIds, elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const allPlans = milestoneIds.flatMap((id) => plansForMilestone(id));
  const primaryPlans = milestoneIds.map((id) => milestoneById(id)?.testPlan).filter((p) => p?.id);
  const linked = allPlans.filter((p) => !primaryPlans.some((pp) => pp.id === p.id));
  const totalTests = allPlans.reduce((s, p) => s + (p.total || 0), 0);
  const passTests = allPlans.reduce((s, p) => s + (p.pass || 0), 0);
  const pendingTests = allPlans.reduce((s, p) => s + (p.pending || 0), 0);
  const avgCoverage =
    allPlans.length > 0
      ? Math.round(allPlans.reduce((s, p) => s + (p.coverage ?? 0), 0) / allPlans.length)
      : 0;
  const execStatuses = primaryPlans.map((p) => planExecutionStatus(p));
  const rollupExec = execStatuses.every((s) => s === "completed")
    ? "completed"
    : execStatuses.some((s) => s === "blocked" || s === "fail")
      ? "blocked"
      : execStatuses.some((s) => s === "in-progress")
        ? "in-progress"
        : "pending";

  el.innerHTML = `
    <div class="kpi"><div class="v">${avgCoverage}%</div><div class="l">Avg test coverage</div></div>
    <div class="kpi"><div class="v">${passTests}/${totalTests}</div><div class="l">Tests passed</div></div>
    <div class="kpi"><div class="v">${linked.length}</div><div class="l">Additional plans</div></div>
    <div class="kpi"><div class="v">${pendingTests}</div><div class="l">Tests not run</div></div>
    <div class="kpi">${statusBadge(rollupExec)}<div class="l" style="margin-top:0.35rem">Execution status</div></div>`;
}

function renderMilestoneTab(milestoneId, panelElementId, kpiElementId) {
  const root = document.getElementById(panelElementId);
  const ms = milestoneById(milestoneId);
  if (!root || !ms) return;

  if (kpiElementId) renderMilestoneTabKpis(milestoneId, kpiElementId);

  const hideLinked = milestoneId === "milestone1";
  root.innerHTML = renderMilestoneSection(ms, { omitId: true, hideLinked });
}

function plansForMilestone2Tab() {
  const m2 = milestoneById("milestone2");
  const amp = milestoneById("amp");
  return [
    m2?.testPlan,
    findPlanById(M2_FDA_PLAN_KEY),
    findPlanById(M2_DTCFALCON_PLAN_KEY),
    findPlanById(M2_RMSMD_PLAN_KEY),
    amp?.testPlan,
  ].filter((p) => p?.id);
}

function renderMilestone2Tab() {
  renderMilestoneTabKpisForPlans(plansForMilestone2Tab(), "milestone2-kpis");
  const root = document.getElementById("milestone2-panel");
  const m2 = milestoneById("milestone2");
  const amp = milestoneById("amp");
  if (!root || !m2 || !amp) return;

  const fda = findPlanById(M2_FDA_PLAN_KEY);
  const falcon = findPlanById(M2_DTCFALCON_PLAN_KEY);
  const rms = findPlanById(M2_RMSMD_PLAN_KEY);

  root.innerHTML =
    renderMilestone2SipSection(m2, fda) +
    renderPipelinePlanSection(
      "DTC Falcon",
      "Falcon Track 2 — Delta Gemini release test plan",
      falcon
    ) +
    renderPipelinePlanSection(
      "RMS-MD Unified Acquisition",
      "Unified acquisition release — end-to-end validation",
      rms
    ) +
    renderPipelinePlanSection("AMP", amp.subtitle || "AMP test plan", amp.testPlan);
}

function renderSyncNote() {
  const el = document.getElementById("sync-note");
  if (!el) return;
  if (ACQUISITION_DATA.jira?.syncRequired && !ACQUISITION_DATA.jira?.lastSynced) {
    el.style.display = "block";
    el.textContent = "Jira not synced — run ./scripts/local-sync.sh on VPN.";
  }
}

function plansForMilestone(id) {
  const ms = milestoneById(id);
  if (!ms) return [];
  return [ms.testPlan, ...(ms.linkedTestPlans || [])].filter((p) => p?.id);
}
