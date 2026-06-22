/* Delta Gemini — shared render helpers for local previews */

function dgPdfLink(prefix) {
  const p = prefix || "";
  return `<a class="dg-pdf-link" href="${p}${DELTA_GEMINI.pdfRef}" target="_blank" rel="noopener">Open source PDF (Delta Gemini Workflow)</a>`;
}

function dgHero(prefix) {
  return `
    <div class="dg-hero">
      <h2>${dgEscape(DELTA_GEMINI.title)}</h2>
      <p>${dgEscape(DELTA_GEMINI.subtitle)}</p>
      <div class="dg-legend"><span class="dg-legend-dot"></span> ${dgEscape(DELTA_GEMINI.legend.newLabel)}</div>
    </div>`;
}

function dgContextRibbon() {
  return `<div class="dg-context-ribbon">${DELTA_GEMINI.contextRibbon
    .map(
      (c) => `<div class="dg-context-chip${c.isNew ? " is-new" : ""}">
        <strong>${dgEscape(c.label)}</strong>
        <span>${dgEscape(c.detail)}</span>
      </div>`
    )
    .join("")}</div>`;
}

function dgSystemGrid(opts) {
  const onlyNew = opts && opts.onlyNew;
  return `<div class="dg-system-grid">${DELTA_GEMINI.systems.map((sys) => {
    const steps = onlyNew ? sys.steps.filter((s) => s.isNew) : sys.steps;
    if (!steps.length) return "";
    return `<article class="dg-system-card">
      <div class="dg-system-head" style="background:${sys.color}">
        <h3>${dgEscape(sys.label)}</h3>
        <span class="dg-system-tag">${dgEscape(sys.tag)}</span>
      </div>
      <ol class="dg-step-list">${steps
        .map(
          (st) => `<li class="${st.isNew ? "is-new" : ""}">
            <span class="dg-step-num">${st.n}</span>
            <span>${dgEscape(st.text)}</span>
          </li>`
        )
        .join("")}</ol>
    </article>`;
  }).join("")}</div>`;
}

function dgDeltaTimeline() {
  const items = dgNewSteps();
  return `<div class="dg-timeline">${items
    .map(
      (it) => `<div class="dg-timeline-item">
        <div class="sys">${dgEscape(it.system)} · Step ${it.n}</div>
        <p>${dgEscape(it.text)}</p>
      </div>`
    )
    .join("")}</div>`;
}

/* Visual flow diagram (PDF-style) */

function dgFlowDiagram(opts) {
  const compact = opts && opts.compact;
  const arrow = '<span class="dg-flow-arrow" aria-hidden="true">→</span>';
  const md = DELTA_GEMINI.systems.find((s) => s.id === "md");
  const fda = DELTA_GEMINI.systems.find((s) => s.id === "fda");
  const falcon = DELTA_GEMINI.systems.find((s) => s.id === "falcon");

  function col(sys, limit) {
    const steps = limit ? sys.steps.slice(0, limit) : sys.steps;
    return `<div class="dg-flow-col">
      <div class="dg-flow-col-head" style="background:${sys.color}">
        <strong>${dgEscape(sys.label)}</strong>
        <span>${dgEscape(sys.tag)}</span>
      </div>
      <ol class="dg-flow-steps">${steps
        .map(
          (st) => `<li class="${st.isNew ? "is-new" : ""}">
            <span class="dg-flow-step-n">${st.n}</span>
            <span>${dgEscape(st.text)}</span>
          </li>`
        )
        .join("")}</ol>
    </div>`;
  }

  const cross = DELTA_GEMINI.contextRibbon.find((c) => c.id === "dro-fda");

  return `<section class="dg-flow-board${compact ? " dg-flow-board--compact" : ""}" aria-label="Delta Gemini workflow diagram">
    <div class="dg-flow-top">
      <div class="dg-flow-pill dg-flow-pill--rightsline">Rightsline</div>
      ${arrow}
      <div class="dg-flow-pill dg-flow-pill--flow">DROs · D+ deal · Licensee = Hulu</div>
      ${arrow}
      <div class="dg-flow-pill dg-flow-pill--target">flows to MD</div>
    </div>

    <div class="dg-flow-feeds">
      <div class="dg-flow-feed"><strong>CPM</strong><span>Hulu Content Portal ID · retrieve title metadata</span></div>
      <div class="dg-flow-feed"><strong>Xavier</strong><span>Retrieve picture versions (Licensee = Hulu)</span></div>
    </div>

    <div class="dg-flow-cross is-new">
      <span class="dg-flow-cross-label">Cross-system</span>
      ${dgEscape(cross.detail)}
    </div>

    <div class="dg-flow-grid">
      ${col(md, compact ? 3 : undefined)}
      <div class="dg-flow-col-arrows">${arrow}<span class="dg-flow-arrow-sub">DRO / avail handoff</span>${arrow}</div>
      ${col(fda, compact ? 3 : undefined)}
      <div class="dg-flow-col-arrows">${arrow}<span class="dg-flow-arrow-sub">cache &amp; topics</span>${arrow}</div>
      ${col(falcon, compact ? 2 : undefined)}
    </div>

    <div class="dg-flow-legend-inline">
      <span class="dg-legend-dot"></span> Red border = new functionality (per PDF legend)
    </div>
  </section>`;
}

function dgPdfEmbed(prefix) {
  const p = prefix || "";
  const src = `${p}${DELTA_GEMINI.pdfRef}`;
  return `<section class="dg-pdf-embed-section">
    <h3 class="dg-pdf-embed-title">Source workflow diagram (PDF)</h3>
    <p class="section-sub" style="margin-top:0">Original Delta Gemini layout from the program PDF.</p>
    <div class="dg-pdf-embed-wrap">
      <iframe class="dg-pdf-embed" src="${src}" title="Delta Gemini Workflow PDF"></iframe>
    </div>
    <p class="section-sub">${dgPdfLink(prefix)}</p>
  </section>`;
}

function dgFullWorkflow(prefix) {
  return `${dgHero(prefix)}${dgFlowDiagram()}${dgContextRibbon()}${dgSystemGrid()}${dgPdfEmbed(prefix)}`;
}

function dgDrawerContent() {
  return `${dgFlowDiagram({ compact: true })}${DELTA_GEMINI.systems
    .map(
      (sys) => `<div class="dg-drawer-system">
        <h4 style="background:${sys.color}">${dgEscape(sys.label)} — ${dgEscape(sys.tag)}</h4>
        <ol class="dg-step-list">${sys.steps
          .map(
            (st) => `<li class="${st.isNew ? "is-new" : ""}">
              <span class="dg-step-num">${st.n}</span>
              <span>${dgEscape(st.text)}</span>
            </li>`
          )
          .join("")}</ol>
      </div>`
    )
    .join("")}`;
}
