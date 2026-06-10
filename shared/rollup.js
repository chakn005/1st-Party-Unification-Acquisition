/* Status roll-up: work items → workflow steps → systems → phases → program */

const JIRA_STATUS_MAP = {
  done: "completed",
  closed: "completed",
  resolved: "completed",
  complete: "completed",
  completed: "completed",
  "in progress": "in-progress",
  "in development": "in-progress",
  implementing: "in-progress",
  active: "in-progress",
  blocked: "blocked",
  impediment: "blocked",
  "on hold": "blocked",
  "to do": "pending",
  open: "pending",
  backlog: "pending",
  new: "pending",
  todo: "pending",
  "not started": "pending",
};

const STATUS_PRIORITY = {
  blocked: 4,
  "at-risk": 3,
  "in-progress": 2,
  pending: 1,
  completed: 0,
};

function mapJiraStatus(name) {
  if (!name) return "pending";
  const key = String(name).trim().toLowerCase();
  return JIRA_STATUS_MAP[key] || "pending";
}

function worstStatus(statuses) {
  if (!statuses.length) return "pending";
  return statuses.reduce((worst, s) => {
    const cur = STATUS_PRIORITY[s] ?? 1;
    const prev = STATUS_PRIORITY[worst] ?? 1;
    return cur > prev ? s : worst;
  }, "completed");
}

function pctComplete(statuses) {
  if (!statuses.length) return 0;
  const done = statuses.filter((s) => s === "completed").length;
  return Math.round((done / statuses.length) * 100);
}

function workItemsForStep(stepId) {
  return (ACQUISITION_DATA.workItems || []).filter(
    (w) => (w.workflowStepIds || []).includes(stepId) || w.workflowStepId === stepId
  );
}

function workItemsForPhase(phaseId) {
  const stepIds = ACQUISITION_DATA.workflowSteps
    .filter((s) => s.phase === phaseId)
    .map((s) => s.id);
  return (ACQUISITION_DATA.workItems || []).filter((w) => {
    const links = w.workflowStepIds || (w.workflowStepId ? [w.workflowStepId] : []);
    return links.some((id) => stepIds.includes(id)) || w.phaseId === phaseId;
  });
}

function workItemsForSystem(systemId) {
  const stepIds = ACQUISITION_DATA.workflowSteps
    .filter((s) => s.system === systemId)
    .map((s) => s.id);
  return (ACQUISITION_DATA.workItems || []).filter((w) => {
    const links = w.workflowStepIds || (w.workflowStepId ? [w.workflowStepId] : []);
    return links.some((id) => stepIds.includes(id)) || w.systemId === systemId;
  });
}

function enrichRollups() {
  const hasWork = (ACQUISITION_DATA.workItems || []).length > 0;

  ACQUISITION_DATA.workflowSteps.forEach((step) => {
    const linked = workItemsForStep(step.id);
    if (linked.length) {
      step.status = worstStatus(linked.map((w) => w.status));
      step.progress = pctComplete(linked.map((w) => w.status));
      step.workCount = linked.length;
    } else if (!step.status) {
      step.status = hasWork ? "pending" : step.status || "pending";
      step.progress = step.progress ?? 0;
    }
  });

  ACQUISITION_DATA.systems.forEach((sys) => {
    const steps = ACQUISITION_DATA.workflowSteps.filter((s) => s.system === sys.id);
    const statuses = steps.map((s) => s.status || "pending");
    sys.status = worstStatus(statuses);
    sys.progress = pctComplete(statuses);
  });

  ACQUISITION_DATA.phases.forEach((phase) => {
    const steps = ACQUISITION_DATA.workflowSteps.filter((s) => s.phase === phase.id);
    const statuses = steps.map((s) => s.status || "pending");
    phase.status = worstStatus(statuses);
    phase.progress = pctComplete(statuses);
    phase.stepCount = steps.length;
  });

  ACQUISITION_DATA.architectureNodes.forEach((node) => {
    const sysMap = {
      rightsline: "rightsline",
      "falcon-src": "falcon",
      "amp-src": "amp",
      "av-src": "sip",
      "sip-src": "sip",
      avails: "falcon",
      content: "sip",
      "s3-avails": "dtc-ua",
      "s3-content": "dtc-ua",
      "unified-acquisition": "dtc-ua",
      "content-portal-arch": "content-portal",
      "dtc-platforms": "dtc",
    };
    const sys = systemById(sysMap[node.id]);
    if (sys) {
      node.status = sys.status;
      node.progress = sys.progress;
    } else {
      node.status = node.status || "pending";
      node.progress = node.progress ?? 0;
    }
  });

  const phaseStatuses = ACQUISITION_DATA.phases.map((p) => p.status || "pending");
  ACQUISITION_DATA.programRollup = {
    status: worstStatus(phaseStatuses),
    progress: pctComplete(phaseStatuses),
    phasesComplete: phaseStatuses.filter((s) => s === "completed").length,
    phaseTotal: ACQUISITION_DATA.phases.length,
    workTotal: (ACQUISITION_DATA.workItems || []).length,
    workDone: (ACQUISITION_DATA.workItems || []).filter((w) => w.status === "completed").length,
  };
}
