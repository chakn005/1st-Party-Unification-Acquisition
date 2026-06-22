/* Delta Gemini — Hulu licensee workflow (from Delta Gemini Workflow PDF) */

const DELTA_GEMINI = {
  title: "Delta Gemini",
  subtitle: "Hulu licensee extension — DRO & avail flows for Licensee = Hulu",
  pdfRef: "assets/delta-gemini-workflow.pdf",
  legend: { newLabel: "New functionality", newColor: "#c0392b" },
  contextRibbon: [
    { id: "rightsline", label: "Rightsline", detail: "DROs for D+ deal with Licensee = Hulu flow to MD" },
    { id: "cpm", label: "CPM", detail: "Hulu Content Portal ID availability · retrieve title metadata" },
    { id: "xavier", label: "Xavier", detail: "Retrieve picture versions (Licensee = Hulu)" },
    { id: "dro-fda", label: "Cross-system", detail: "Send DRO payload to FDA with Hulu CP ID in new Kafka topic", isNew: true },
  ],
  systems: [
    {
      id: "md",
      label: "MD",
      tag: "Hulu Fleet",
      color: "#0d9488",
      steps: [
        { n: 1, text: "Setup a new Fleet called Hulu with all required modules", isNew: true },
        { n: 2, text: "Process DROs with Licensee = Hulu and Hulu CP ID in this fleet", isNew: true },
        { n: 3, text: "Picture version call to Xavier with Licensee = Hulu", isNew: true },
        { n: 4, text: "Maintain same territory-to-language mapping as Disney+ fleet", isNew: false },
        { n: 5, text: "Send payload to Falcon with Hulu CP ID", isNew: true },
      ],
    },
    {
      id: "fda",
      label: "FDA",
      tag: "Hulu Fleet",
      color: "#7c3aed",
      steps: [
        { n: 1, text: "Setup a new Fleet called Hulu with required tabs and feature controls", isNew: true },
        { n: 2, text: "Process avails with Licensee = Hulu and Hulu CP ID in this fleet", isNew: true },
        { n: 3, text: "Send avails via Kafka", isNew: true },
        { n: 4, text: "Deliver to Disney Streaming (possibly new folder) and obtain ingestion status back", isNew: true },
        { n: 5, text: "Maintain same holdback explosion logic as Disney+ fleet", isNew: false },
        { n: 6, text: "Generate ingest avails for Hulu licensee events", isNew: true },
      ],
    },
    {
      id: "falcon",
      label: "Falcon",
      tag: "Platform cache & topics",
      color: "#1f80e0",
      steps: [
        { n: 1, text: "Populate and update MD cache with Hulu CP ID", isNew: true },
        { n: 2, text: "Create separate Kafka topic for Hulu", isNew: true },
      ],
    },
  ],
};

function dgNewSteps() {
  return DELTA_GEMINI.systems.flatMap((s) =>
    s.steps.filter((st) => st.isNew).map((st) => ({ system: s.label, ...st }))
  );
}

function dgEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
