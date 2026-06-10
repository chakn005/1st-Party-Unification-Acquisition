/* Delta Gemini — overlay on E2E Pipeline tab (Option B) */

function dgBindOverlay() {
  const overlay = document.getElementById("dg-overlay");
  const openBtn = document.getElementById("dg-open");
  const closeBtn = document.getElementById("dg-close");
  const body = document.getElementById("dg-overlay-body");
  if (!overlay || !openBtn) return;

  if (body && !body.dataset.ready) {
    body.innerHTML = dgFullWorkflow(acqPrefix());
    body.dataset.ready = "1";
  }

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    overlay.classList.add("open");
  });
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      overlay.classList.remove("open");
    });
  }
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.classList.remove("open");
  });
}

function dgSyncFloatTrigger(tabId) {
  const openBtn = document.getElementById("dg-open");
  if (!openBtn) return;
  openBtn.hidden = tabId !== "pipeline";
}

function dgHookPipelineTab() {
  const tabBar = document.getElementById("tabs");
  if (!tabBar) return;

  tabBar.querySelectorAll("[data-tab]").forEach((tab) => {
    tab.addEventListener("click", () => dgSyncFloatTrigger(tab.dataset.tab));
  });

  const active = tabBar.querySelector("[data-tab].active");
  dgSyncFloatTrigger(active?.dataset.tab || "milestone1");
}

/** Production console — call after initTabs() and renderWorkflowDiagram(). */
function dgInitDeltaGeminiOverlay() {
  dgBindOverlay();
  dgHookPipelineTab();
}

/* Local preview helpers (delta-gemini-options/) */
function dgBindDrawer() {
  const drawer = document.getElementById("dg-drawer");
  const openBtn = document.getElementById("dg-drawer-open");
  const closeBtn = document.getElementById("dg-drawer-close");
  const ribbon = document.getElementById("dg-drawer-ribbon");
  const body = document.getElementById("dg-drawer-body");
  if (!drawer || !openBtn) return;

  if (body && !body.dataset.ready) {
    body.innerHTML = dgDrawerContent();
    body.dataset.ready = "1";
  }
  if (ribbon && !ribbon.dataset.ready) {
    ribbon.innerHTML = DELTA_GEMINI.contextRibbon.slice(0, 2)
      .map(
        (c) =>
          `<div class="dg-context-chip" style="flex:1 1 auto"><strong>${dgEscape(c.label)}</strong><span>${dgEscape(c.detail)}</span></div>`
      )
      .join("");
    ribbon.dataset.ready = "1";
  }

  function setOpen(open) {
    drawer.classList.toggle("open", open);
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  });
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setOpen(false);
    });
  }
}

function dgInitPipelinePreview(mode) {
  const root = document.getElementById("workflow-diagram-root");
  try {
    if (typeof renderWorkflowDiagram === "function") {
      renderWorkflowDiagram();
    }
  } catch (err) {
    if (root) {
      root.innerHTML =
        '<p class="section-sub" style="color:var(--disney-red)">Could not load E2E pipeline preview.</p>';
    }
    console.error("dgInitPipelinePreview:", err);
  }

  const prefix = window.ACQ_PREFIX || "../../";
  const body = document.getElementById("dg-overlay-body");
  if (body && !body.dataset.ready && mode === "overlay") {
    body.innerHTML = dgFullWorkflow(prefix);
    body.dataset.ready = "1";
  }

  if (mode === "overlay") {
    dgBindOverlay();
    const openBtn = document.getElementById("dg-open");
    if (openBtn) openBtn.hidden = false;
  }
  if (mode === "drawer") dgBindDrawer();
}
