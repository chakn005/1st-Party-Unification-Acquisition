/* E2E Acquisition Pipeline — workflow diagram from unified.docx (architecture + swimlane) */

const WORKFLOW_DIAGRAM = {
  architecture: {
    title: "Target architecture — source systems to DTC",
    groups: {
      rightsAvails: { label: "Rights & Avails", nodes: ["rightsline", "falcon"] },
      assetsMedia: { label: "Assets & Media Services", nodes: ["amp", "av", "sip"] },
    },
    objects: {
      avails: { label: "Avails", tags: ["Hulu Avail", "Disney+ Avail", "ESPN+ Avail"] },
      content: { label: "Content", tags: ["AMP", "AV"] },
    },
    storage: { label: "Storage", buckets: ["S3 (Avails)", "S3 (Content)"] },
    dtc: {
      label: "Direct To Consumer",
      nodes: [
        { id: "unified-acquisition", name: "Unified Acquisition" },
        { id: "content-portal", name: "Content Portal" },
        { id: "dtc-platforms", name: "DTC", platforms: ["Disney+", "ESPN+", "Hulu"] },
      ],
    },
    apiFlows: [
      { from: "content-portal", to: "rights-avails", label: "CP User Name" },
      { from: "falcon", to: "unified-acquisition", label: "Invoke DTC Acquisition API per Avail with CP User Name" },
      { from: "sip", to: "unified-acquisition", label: "Invoke DTC Acquisition API per delivery (AMP)" },
      { from: "sip", to: "unified-acquisition", label: "Invoke DTC Acquisition API per delivery (AV)", duplicate: true },
    ],
    nodeDetails: {
      rightsline: { summary: "Content deal and distribution rights source.", milestone: "milestone1" },
      falcon: { summary: "Creates and publishes EMA Avail; sends S3 key and CP User Name to DTC Acquisition.", milestone: "milestone1" },
      amp: { summary: "AMP Ops orders, confirms, and releases asset management package.", milestone: "amp" },
      av: { summary: "Audio/video components for mastering and localization.", milestone: "milestone2" },
      sip: { summary: "Delivers AMP and AV to DTC S3; invokes acquisition API per delivery.", milestone: "milestone2" },
      "unified-acquisition": { summary: "Ingests avails, AMP, and AV from S3; orchestrates handoff to catalog.", milestone: "milestone1" },
      "content-portal": { summary: "Content Portal; CP User Name feedback to rights.", milestone: "milestone2" },
      "dtc-platforms": { summary: "Client-ready content on Disney+, ESPN+, and Hulu.", milestone: "milestone2" },
    },
  },
  swimlanes: [
    {
      id: "cpm-system",
      label: "Content Partner Manager",
      sub: "System",
      icon: "🖥",
      milestone: "milestone1",
      steps: [{ id: "s01", text: "CPM system creates CP ID with CP User Name." }],
    },
    {
      id: "cpm-team",
      label: "Content Partner Manager",
      sub: "Team (CPD)",
      milestone: "milestone1",
      steps: [
        { id: "s02", text: "CPM Team creates new CP in CPM — generates CP ID and External Identifier." },
      ],
    },
    {
      id: "rightsline",
      label: "Rightsline",
      steps: [
        { id: "s03", text: "Consumes CP External Identifier (auto or manual entry)." },
        { id: "s04", text: "Creates Distribution Rights Out for Hulu or Disney+." },
      ],
      milestone: "milestone1",
    },
    {
      id: "falcon",
      label: "Falcon",
      sub: "Distribution Operations Avails",
      icon: "🖥",
      steps: [
        { id: "s05", text: "Creates and publishes EMA Avail to existing S3 bucket." },
        { id: "s06", text: "Sends payload: S3 Key / Avail Location + CP User Name → DTC Acquisition." },
        { id: "s09", text: "Updates Avail Status after acquisition status published back." },
      ],
      milestone: "milestone1",
    },
    {
      id: "dtc-ua",
      label: "DTC Unified Acquisition",
      steps: [
        { id: "s07", text: "Ingests EMA Avail; hands off to DTC Catalog." },
        { id: "s09b", text: "Publishes acquisition status back to Falcon." },
        { id: "s14", text: "Ingests AMP; hands off to DTC Catalog." },
        { id: "s18", text: "Ingests AV; hands off to processing." },
      ],
      milestone: "milestone1",
    },
    {
      id: "dtc-catalog",
      label: "DTC Catalog",
      steps: [
        { id: "s08", text: "Maps CP User Name → Content ID and ALID in EMA Avail." },
        { id: "s15", text: "Maps AMP Content ID → CP User Name." },
        { id: "s19", text: "Adds CP ID based on ALID → CP User Name mapping." },
      ],
      milestone: "milestone2",
    },
    {
      id: "sip",
      label: "SIP",
      sub: "Distribution Operations AV",
      icon: "🖥",
      steps: [
        { id: "s12", text: "Delivers AMP to DTC S3." },
        { id: "s13", text: "Sends payload: S3 Key / AMP MMC location → DTC Acquisition." },
        { id: "s16", text: "Orders and distributes AV components to SIP using ALID." },
        { id: "s17", text: "Delivers AV to DTC S3." },
        { id: "s17b", text: "Sends payload: S3 Key / AV MMC location → DTC Acquisition." },
      ],
      milestone: "milestone2",
    },
    {
      id: "amp",
      label: "AMP",
      sub: "Distribution Operations AMP",
      icon: "🖥",
      steps: [{ id: "s11", text: "AMP Ops orders, confirms, and releases the AMP." }],
      milestone: "amp",
    },
  ],
  phases: [
    { id: "avail", label: "Avail pipeline", stepIds: ["s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09", "s09b"] },
    { id: "amp", label: "AMP delivery", stepIds: ["s11", "s12", "s13", "s14", "s15"] },
    { id: "av", label: "AV delivery", stepIds: ["s16", "s17", "s17b", "s18", "s19"] },
  ],
};

function milestoneStatusFor(id) {
  if (!id) return "pending";
  const ms = milestoneById(id);
  return ms?.testPlan ? planExecutionStatus(ms.testPlan) : "pending";
}

function milestonePlanLink(id) {
  const ms = milestoneById(id);
  const plan = ms?.testPlan;
  if (!plan) return "";
  return `<div class="wf-detail-milestone">QA: ${jiraLink(plan.id, plan.name)} — ${statusBadge(planExecutionStatus(plan))} · ${plan.coverage}% (${plan.pass}/${plan.total})</div>`;
}

function renderWorkflowDiagram() {
  const root = document.getElementById("workflow-diagram-root");
  if (!root) return;

  const arch = WORKFLOW_DIAGRAM.architecture;
  root.innerHTML = `
    <div class="wf-ua-exec">
      <header class="wf-ua-hero">
        <h2>1st Party DTC Unified Acquisition — E2E Pipeline</h2>
        <p>End-to-end workflow from the program architecture and implementation swimlane (unified.docx). Solid flows show data movement; API triggers are listed below the architecture view.</p>
      </header>

      <div class="wf-ua-legend">
        <span class="wf-legend-solid">Data flow</span>
        <span class="wf-legend-api">API / control (from diagram)</span>
      </div>

      <section class="wf-arch-board" aria-label="Architecture diagram">
        <h3 class="wf-swim-title" style="margin-top:0">${escapeHtml(arch.title)}</h3>
        ${renderArchitectureCanvas(arch)}
        <div class="wf-api-layer">
          <h5>API &amp; identifier flows</h5>
          <div class="wf-api-list">${arch.apiFlows.map((a) => `<div class="wf-api-item">${escapeHtml(a.label)}</div>`).join("")}</div>
        </div>
      </section>

      <h3 class="wf-swim-title">Implementation swimlane</h3>
      <p class="section-sub" style="margin-top:-0.25rem">Sequential handoffs across CPM, Rightsline, Falcon, DTC Unified Acquisition, Catalog, SIP, and AMP.</p>
      <div class="wf-swim-board">${renderSwimlanes()}</div>
      <p class="section-sub" style="margin-top:0.5rem">
        <a href="${acqPrefix()}assets/swimlane-reference.png" target="_blank" rel="noopener">View full swimlane diagram (unified.docx)</a>
      </p>

      <div class="wf-detail-panel" id="wf-diagram-detail">
        <p style="color:var(--disney-muted);margin:0">Select an architecture component for details and linked QA milestone.</p>
      </div>
    </div>`;

  bindDiagramInteractions(root);
}

function renderArchitectureCanvas(arch) {
  const arrow = `<span class="wf-arch-arrow" aria-hidden="true">→</span>`;

  return `
    <div class="wf-arch-grid">
      <div class="wf-arch-group wf-arch-g-r1c1">
        <h4>${escapeHtml(arch.groups.rightsAvails.label)}</h4>
        <div class="wf-arch-chain">
          <span class="wf-arch-node" data-arch-node="rightsline">Rightsline</span>${arrow}
          <span class="wf-arch-node" data-arch-node="falcon">Falcon</span>
        </div>
      </div>
      <div class="wf-arch-g-r1c2">${arrow}</div>
      <div class="wf-arch-object wf-arch-g-r1c3">
        <h4>${escapeHtml(arch.objects.avails.label)}</h4>
        <div class="wf-arch-tags">${arch.objects.avails.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>
      </div>
      <div class="wf-arch-g-r1c4">${arrow}</div>
      <div class="wf-arch-g-r1c5"><div class="wf-s3-icon">${escapeHtml(arch.storage.buckets[0])}</div></div>
      <div class="wf-arch-g-r1c6 wf-arch-arrow-into-dtc">${arrow}</div>

      <div class="wf-arch-group wf-arch-g-r2c1">
        <h4>${escapeHtml(arch.groups.assetsMedia.label)}</h4>
        <div class="wf-arch-chain">
          <span class="wf-arch-node" data-arch-node="amp">AMP</span>
          <span class="wf-arch-node" data-arch-node="av">AV</span>${arrow}
          <span class="wf-arch-node" data-arch-node="sip">SIP</span>
        </div>
      </div>
      <div class="wf-arch-g-r2c2">${arrow}</div>
      <div class="wf-arch-object wf-arch-g-r2c3">
        <h4>${escapeHtml(arch.objects.content.label)}</h4>
        <div class="wf-arch-tags">${arch.objects.content.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>
      </div>
      <div class="wf-arch-g-r2c4">${arrow}</div>
      <div class="wf-arch-g-r2c5"><div class="wf-s3-icon">${escapeHtml(arch.storage.buckets[1])}</div></div>
      <div class="wf-arch-g-r2c6 wf-arch-arrow-into-dtc">${arrow}</div>

      <div class="wf-arch-dtc wf-arch-dtc-column">
        <h4>${escapeHtml(arch.dtc.label)}</h4>
        <div class="wf-arch-dtc-chain">
          <div class="wf-dtc-stack">
            <span class="wf-arch-node wf-arch-node-ua" data-arch-node="unified-acquisition">Unified Acquisition</span>
            <span class="wf-arch-arrow">↓</span>
            <span class="wf-arch-node" data-arch-node="content-portal">Content Portal</span>
            <span class="wf-arch-arrow">↓</span>
            <div class="wf-arch-platforms">
              ${arch.dtc.nodes[2].platforms.map((p) => `<span>${escapeHtml(p)}</span>`).join("")}
            </div>
          </div>
        </div>
        <div class="wf-arch-dtc-spacer" aria-hidden="true"></div>
      </div>
    </div>
    <p class="section-sub" style="margin:0.75rem 0 0">
      <a href="${acqPrefix()}assets/architecture-reference.png" target="_blank" rel="noopener">View source architecture diagram (unified.docx)</a>
      ·
      <a href="${acqPrefix()}assets/swimlane-reference.png" target="_blank" rel="noopener">View source swimlane (unified.docx)</a>
    </p>`;
}

function renderSwimlanes() {
  let stepNum = 0;
  return WORKFLOW_DIAGRAM.swimlanes
    .map((lane) => {
      const stepsHtml = lane.steps
        .map((step) => {
          stepNum += 1;
          const st = milestoneStatusFor(lane.milestone);
          return `<div class="wf-swim-step ${statusClass(st)}" data-swim-step="${step.id}" data-lane="${lane.id}" data-milestone="${lane.milestone || ""}">
            <div class="wf-swim-step-num">Step ${stepNum}</div>
            ${escapeHtml(step.text)}
          </div>`;
        })
        .join("");
      return `<div class="wf-swim-lane">
        <div class="wf-swim-lane-label">
          ${lane.icon ? `<span class="wf-swim-lane-icon">${lane.icon}</span>` : ""}
          <span>${escapeHtml(lane.label)}${lane.sub ? `<br><small style="font-weight:400;color:var(--disney-muted)">${escapeHtml(lane.sub)}</small>` : ""}</span>
        </div>
        <div class="wf-swim-track">${stepsHtml}</div>
      </div>`;
    })
    .join("");
}

function showDiagramDetail(html) {
  const el = document.getElementById("wf-diagram-detail");
  if (el) el.innerHTML = html;
}

function bindDiagramInteractions(root) {
  const archDetails = WORKFLOW_DIAGRAM.architecture.nodeDetails;

  root.querySelectorAll("[data-arch-node]").forEach((node) => {
    node.addEventListener("click", () => {
      root.querySelectorAll("[data-arch-node]").forEach((n) => n.classList.remove("selected"));
      node.classList.add("selected");
      const id = node.dataset.archNode;
      const info = archDetails[id] || {};
      showDiagramDetail(`
        <h3>${escapeHtml(node.textContent.trim())}</h3>
        <p>${escapeHtml(info.summary || "")}</p>
        ${info.milestone ? milestonePlanLink(info.milestone) : ""}`);
    });
  });

}

function renderConsolidatedWorkflow() {
  renderWorkflowDiagram();
}
