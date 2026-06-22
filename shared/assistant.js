/* Program Assistant — answers from synced ACQUISITION_DATA (no external API) */

const AcqAssistant = (function () {
  const SUGGESTIONS = [
    "What's the program coverage?",
    "Summarize Milestone 1",
    "M1 cross-alliance heatmap status",
    "Which test plans are lagging?",
    "When was Jira last synced?",
    "How do I share heatmap updates?",
  ];

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s/-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function fmtPct(n) {
    return `${Math.round(Number(n) || 0)}%`;
  }

  function fmtPlan(plan) {
    if (!plan) return "";
    const cov = fmtPct(plan.coverage);
    return `${jiraLink(plan.id, plan.id)} — ${escapeHtml(plan.shortName || plan.name || plan.id)}: <strong>${plan.pass ?? 0}/${plan.total ?? 0}</strong> pass (${cov}), Jira <em>${escapeHtml(plan.jiraStatus || "—")}</em>`;
  }

  function allPlans() {
    const out = [];
    (ACQUISITION_DATA.milestones || []).forEach((m) => {
      if (m.testPlan) out.push({ ...m.testPlan, milestoneName: m.name });
      (m.linkedTestPlans || []).forEach((p) => out.push({ ...p, milestoneName: m.name, linked: true }));
    });
    return out;
  }

  function findPlan(keyword) {
    const q = normalize(keyword);
    return allPlans().find((p) => {
      const hay = normalize(`${p.id} ${p.name} ${p.shortName}`);
      return hay.includes(q);
    });
  }

  function heatmapSummary() {
    const programs = ACQUISITION_DATA.programHeatmaps || [];
    if (!programs.length) return "<p>No program heatmap data loaded.</p>";

    return programs
      .map((program) => {
        if (!program.available) {
          return `<p><strong>${escapeHtml(program.title)}</strong> — not yet available (${escapeHtml(program.placeholderMessage || "TBD")}).</p>`;
        }
        const counts = { completed: 0, "in-progress": 0, pending: 0, risk: 0 };
        const rows = [];
        (program.alliances || []).forEach((a) => {
          (program.columns || []).forEach((c) => {
            const synced = program.cells?.[a.id]?.[c.id]?.status || "pending";
            const slug =
              typeof HeatmapShare !== "undefined"
                ? HeatmapShare.effectiveSlug(a.id, c.id, synced)
                : synced;
            if (counts[slug] !== undefined) counts[slug] += 1;
            const cell = program.cells?.[a.id]?.[c.id];
            const tests =
              cell?.total > 0 ? ` (${cell.pass ?? 0}/${cell.total} Xray)` : "";
            rows.push(
              `<li>${escapeHtml(a.name)} · ${escapeHtml(c.short || c.label)}: <strong>${escapeHtml(HeatmapShare?.labelFor(slug) || slug)}</strong>${escapeHtml(tests)}</li>`
            );
          });
        });
        const jira = program.jiraKey ? jiraLink(program.jiraKey, program.jiraKey) : "";
        return `<p><strong>${escapeHtml(program.title)}</strong>${jira ? ` · ${jira}` : ""}</p>
          <ul>${rows.join("")}</ul>
          <p>Totals — Completed ${counts.completed}, In Progress ${counts["in-progress"]}, Pending ${counts.pending}, Risk ${counts.risk}.</p>`;
      })
      .join("");
  }

  function laggingPlans() {
    const plans = allPlans()
      .map((p) => ({
        plan: p,
        score: (p.fail || 0) * 1000 + (p.pending || 0) - (p.coverage || 0),
      }))
      .sort((a, b) => b.score - a.score);

    const withFail = plans.filter(({ plan }) => (plan.fail || 0) > 0);
    const lowCov = plans.filter(({ plan }) => (plan.coverage || 0) < 50 && (plan.total || 0) > 0);

    let html = "";
    if (withFail.length) {
      html += `<p><strong>Plans with failures:</strong></p><ul>${withFail.map(({ plan }) => `<li>${fmtPlan(plan)}</li>`).join("")}</ul>`;
    } else {
      html += "<p>No failing tests across synced plans.</p>";
    }
    if (lowCov.length) {
      html += `<p><strong>Lower coverage (&lt;50%):</strong></p><ul>${lowCov.map(({ plan }) => `<li>${fmtPlan(plan)}</li>`).join("")}</ul>`;
    }
    return html || "<p>All synced plans look healthy on coverage.</p>";
  }

  function answerCoverage() {
    const r = ACQUISITION_DATA.programRollup || {};
    const epic = ACQUISITION_DATA.epic || {};
    return `<p>Program rollup for epic ${jiraLink(epic.key || "CPTR-72227", epic.key || "CPTR-72227")}:</p>
      <ul>
        <li>Coverage: <strong>${fmtPct(r.coverage)}</strong></li>
        <li>Tests: <strong>${r.pass ?? 0}/${r.total ?? 0}</strong> pass · ${r.fail ?? 0} fail · ${r.pending ?? 0} pending</li>
        <li>Test plans tracked: <strong>${r.planCount ?? 0}</strong></li>
        <li>Epic status: <em>${escapeHtml(epic.jiraStatus || "—")}</em> · assignee ${escapeHtml(epic.assignee || "—")}</li>
      </ul>`;
  }

  function answerMilestone(num) {
    const id = num === 1 ? "milestone1" : num === 2 ? "milestone2" : null;
    const m = (ACQUISITION_DATA.milestones || []).find((x) => x.id === id);
    if (!m) return "<p>Milestone not found in synced data.</p>";
    let html = `<p><strong>${escapeHtml(m.name)}</strong> — ${escapeHtml(m.subtitle || "")}</p>`;
    if (m.testPlan) html += `<ul><li>${fmtPlan(m.testPlan)}</li></ul>`;
    if (m.linkedTestPlans?.length) {
      html += `<p>Linked pipeline plans:</p><ul>${m.linkedTestPlans.map((p) => `<li>${fmtPlan(p)}</li>`).join("")}</ul>`;
    }
    return html;
  }

  function answerSync() {
    const j = ACQUISITION_DATA.jira || {};
    return `<p>Jira data last synced: <strong>${escapeHtml(formatSyncTime())}</strong> (version ${escapeHtml(j.dataVersion || "—")}).</p>
      <p>Synced plans: ${(j.syncTestPlans || []).map((k) => jiraLink(k, k)).join(", ") || "—"}.</p>
      <p>To refresh: run <code>./scripts/local-sync.sh</code> on VPN, then commit <code>shared/data.json</code> and push.</p>`;
  }

  function answerShare() {
    return `<p>On the <strong>Overview</strong> tab, click heatmap cells to cycle status (Completed → In Progress → Pending → Risk), then use <strong>Copy share link</strong>.</p>
      <p>The URL includes <code>?updated=…&amp;s=…</code> so leaders opening that link see your latest snapshot — same pattern as the <a href="https://chakn005.github.io/Content_flow_Integration/" target="_blank" rel="noopener noreferrer">Cross‑Alliance E2E console</a>.</p>`;
  }

  function answerHelp() {
    return `<p>I answer from synced Jira/Xray data in this console — no live API calls from the browser.</p>
      <p>Try asking about:</p>
      <ul>
        <li>Program coverage and epic status</li>
        <li>Milestone 1 or 2 test plans (SIP, Falcon, FDA, RMS-MD, AMP)</li>
        <li>M1 cross-alliance heatmap cells</li>
        <li>Plans with failures or low coverage</li>
        <li>Last Jira sync and sharing heatmap updates</li>
      </ul>`;
  }

  function answer(query) {
    const q = normalize(query);
    if (!q) return "<p>Ask a question about coverage, milestones, heatmaps, or Jira sync.</p>";

    if (/help|what can you|how do i use/.test(q)) return answerHelp();
    if (/share|leader|snapshot|copy link/.test(q)) return answerShare();
    if (/sync|last sync|when.*update|data version/.test(q)) return answerSync();
    if (/heatmap|cross alliance|cross-alliance|overview|cptr-72676|72676/.test(q)) return heatmapSummary();
    if (/lag|behind|slow|low coverage|fail|risk|block/.test(q)) return laggingPlans();
    if (/coverage|rollup|overall|program status|summary/.test(q)) return answerCoverage();
    if (/milestone\s*1|\bm1\b|17790|dmmedninja-17790/.test(q)) return answerMilestone(1);
    if (/milestone\s*2|\bm2\b|17818|dmmedninja-17818/.test(q)) return answerMilestone(2);
    if (/amp|omfg|19970/.test(q)) {
      const amp = (ACQUISITION_DATA.milestones || []).find((m) => m.id === "amp");
      return amp?.testPlan
        ? `<p><strong>AMP</strong> — ${escapeHtml(amp.subtitle || "")}</p><ul><li>${fmtPlan(amp.testPlan)}</li></ul>`
        : "<p>AMP plan not found in synced data.</p>";
    }
    if (/falcon|28094|rights-28094/.test(q)) {
      const p = findPlan("28094");
      return p ? `<ul><li>${fmtPlan(p)}</li></ul>` : "<p>Falcon plan not found.</p>";
    }
    if (/fda|28225|rights-28225/.test(q)) {
      const p = findPlan("28225");
      return p ? `<ul><li>${fmtPlan(p)}</li></ul>` : "<p>FDA plan not found.</p>";
    }
    if (/rms|rms-md|28328|rights-28328/.test(q)) {
      const p = findPlan("28328");
      return p ? `<ul><li>${fmtPlan(p)}</li></ul>` : "<p>RMS-MD plan not found.</p>";
    }
    if (/epic|72227|cptr-72227/.test(q)) {
      const epic = ACQUISITION_DATA.epic || {};
      return `<p>${jiraLink(epic.key, epic.summary || epic.key)} — <em>${escapeHtml(epic.jiraStatus || "—")}</em>, assignee ${escapeHtml(epic.assignee || "—")}.</p>${answerCoverage()}`;
    }
    if (/pipeline|e2e|workflow|diagram/.test(q)) {
      return `<p>Open the <strong>E2E Acquisition Pipeline</strong> tab for the architecture swimlane (Assets &amp; Media → Content → S3 → DTC, plus Rights &amp; Avails path).</p>
        <p>Delta Gemini workflow link is on that tab only.</p>`;
    }
    if (/evidence|traceability|test plan/.test(q)) {
      return `<p>Open <strong>QA Evidence &amp; Traceability</strong> for Jira test plans grouped by milestone. ${answerCoverage()}</p>`;
    }

    const plan = findPlan(q);
    if (plan) return `<ul><li>${fmtPlan(plan)}</li></ul>`;

    return `<p>I didn't match that exactly. ${answerHelp()}</p>`;
  }

  function renderSuggestions(container, onPick) {
    container.innerHTML = SUGGESTIONS.map(
      (s) =>
        `<button type="button" class="acq-assistant-chip" data-suggest="${escapeHtml(s)}">${escapeHtml(s)}</button>`
    ).join("");
    container.querySelectorAll("[data-suggest]").forEach((btn) => {
      btn.addEventListener("click", () => onPick(btn.dataset.suggest));
    });
  }

  function appendMessage(log, role, html) {
    const item = document.createElement("div");
    item.className = `acq-assistant-msg acq-assistant-msg--${role}`;
    item.innerHTML =
      role === "user"
        ? `<div class="acq-assistant-bubble">${escapeHtml(html)}</div>`
        : `<div class="acq-assistant-bubble acq-assistant-bubble--bot">${html}</div>`;
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
  }

  function mountAssistant() {
    if (document.getElementById("acq-assistant-root")) return;

    const root = document.createElement("div");
    root.id = "acq-assistant-root";
    root.innerHTML = `
      <button type="button" id="acq-assistant-toggle" class="acq-assistant-toggle" aria-expanded="false" aria-controls="acq-assistant-panel">
        <span class="acq-assistant-toggle-icon" aria-hidden="true">✦</span>
        <span class="acq-assistant-toggle-label">Assistant</span>
      </button>
      <section id="acq-assistant-panel" class="acq-assistant-panel" hidden aria-label="Program assistant">
        <header class="acq-assistant-head">
          <div>
            <h2 class="acq-assistant-title">Program Assistant</h2>
            <p class="acq-assistant-sub">Answers from synced Jira data · CPTR-72227</p>
          </div>
          <button type="button" id="acq-assistant-close" class="acq-assistant-close" aria-label="Close assistant">×</button>
        </header>
        <div id="acq-assistant-log" class="acq-assistant-log" role="log" aria-live="polite"></div>
        <div id="acq-assistant-suggestions" class="acq-assistant-suggestions"></div>
        <form id="acq-assistant-form" class="acq-assistant-form">
          <label class="visually-hidden" for="acq-assistant-input">Ask the assistant</label>
          <input type="text" id="acq-assistant-input" class="acq-assistant-input" placeholder="Ask about coverage, milestones, heatmap…" autocomplete="off" maxlength="500" />
          <button type="submit" class="acq-assistant-send">Send</button>
        </form>
      </section>`;
    document.body.appendChild(root);

    const toggle = document.getElementById("acq-assistant-toggle");
    const panel = document.getElementById("acq-assistant-panel");
    const closeBtn = document.getElementById("acq-assistant-close");
    const log = document.getElementById("acq-assistant-log");
    const form = document.getElementById("acq-assistant-form");
    const input = document.getElementById("acq-assistant-input");
    const suggestions = document.getElementById("acq-assistant-suggestions");

    function setOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open) input.focus();
    }

    function submitQuery(text) {
      const q = String(text || "").trim();
      if (!q) return;
      appendMessage(log, "user", q);
      appendMessage(log, "assistant", answer(q));
      input.value = "";
    }

    toggle.addEventListener("click", () => setOpen(panel.hidden));
    closeBtn.addEventListener("click", () => setOpen(false));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitQuery(input.value);
    });

    renderSuggestions(suggestions, submitQuery);

    appendMessage(
      log,
      "assistant",
      `<p>Hi — I can summarize program coverage, milestone test plans, M1 cross-alliance heatmap, lagging plans, and how to share status with leaders.</p>`
    );
  }

  return { initAssistant: mountAssistant, answer };
})();
