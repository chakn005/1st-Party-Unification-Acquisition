const ARCH_LANES = [
  { id: "sources", label: "Source systems" },
  { id: "objects", label: "Data objects" },
  { id: "storage", label: "Storage" },
  { id: "dtc", label: "Direct to consumer" },
];

function renderArchitecture() {
  const root = document.getElementById("arch-pipeline");
  const detail = document.getElementById("arch-detail");
  if (!root) return;

  const nodesByLane = {};
  ACQUISITION_DATA.architectureNodes.forEach((n) => {
    if (!nodesByLane[n.lane]) nodesByLane[n.lane] = [];
    nodesByLane[n.lane].push(n);
  });

  let html = "";
  ARCH_LANES.forEach((lane) => {
    const nodes = nodesByLane[lane.id] || [];
    if (!nodes.length) return;
    html += `<div class="arch-lane-label">${escapeHtml(lane.label)}</div><div class="arch-pipeline">`;
    nodes.forEach((node, i) => {
      if (i > 0) html += `<span class="arch-arrow" aria-hidden="true">→</span>`;
      html += `<div class="arch-node" data-arch="${node.id}">
        <h4>${escapeHtml(node.name)}</h4>
        <p>${escapeHtml(node.group)}</p>
        <div style="margin-top:0.35rem">${statusBadge(node.status || "pending")}</div>
      </div>`;
    });
    html += "</div>";
  });
  root.innerHTML = html;

  root.querySelectorAll(".arch-node").forEach((el) => {
    el.addEventListener("click", () => {
      root.querySelectorAll(".arch-node").forEach((n) => n.classList.remove("selected"));
      el.classList.add("selected");
      const node = archNodeById(el.dataset.arch);
      const items = (ACQUISITION_DATA.workItems || []).filter((w) => (w.systemId || "") === mapArchToSystem(node.id));
      detail.innerHTML = `
        <h3>${escapeHtml(node.name)}</h3>
        <p style="color:var(--muted)">${escapeHtml(node.group)} · ${statusBadge(node.status || "pending")} · ${node.progress || 0}% rolled up</p>
        ${items.length ? `<ul>${items.map((w) => `<li>${jiraLink(w.key, w.key)} — ${escapeHtml(w.summary)}</li>`).join("")}</ul>` : "<p style=\"color:var(--muted)\">Select workflow or sync Jira to see linked implementation tickets.</p>"}`;
    });
  });

  if (detail && !detail.innerHTML) {
    detail.innerHTML = "<p style=\"color:var(--muted)\">Select an architecture node to view status and linked work.</p>";
  }
}

function mapArchToSystem(archId) {
  const m = {
    rightsline: "rightsline",
    "falcon-src": "falcon",
    avails: "falcon",
    "amp-src": "amp",
    "av-src": "sip",
    "sip-src": "sip",
    content: "sip",
    "s3-avails": "dtc-ua",
    "s3-content": "dtc-ua",
    "unified-acquisition": "dtc-ua",
    "content-portal-arch": "content-portal",
    "dtc-platforms": "dtc",
  };
  return m[archId] || "";
}
