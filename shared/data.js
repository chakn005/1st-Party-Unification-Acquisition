/* 1st Party Unification Acquisition — shared data (auto-generated from data.json) */
window.ACQUISITION_DATA = {
  "program": "1st Party Unification Acquisition",
  "epic": "CPTR-72227",
  "env": "Implementation",
  "jira": {
    "baseUrl": "https://jira.disney.com",
    "browsePath": "/browse/",
    "epicKey": "CPTR-72227",
    "lastSynced": null,
    "syncSource": "scripts/sync-from-jira.py",
    "syncRequired": true,
    "dataVersion": "20260603160000"
  },
  "statusLabels": {
    "completed": { "label": "Complete", "class": "status-completed" },
    "in-progress": { "label": "In Progress", "class": "status-progress" },
    "pending": { "label": "Not Started", "class": "status-pending" },
    "blocked": { "label": "Blocked", "class": "status-blocked" },
    "at-risk": { "label": "At Risk", "class": "status-risk" }
  },
  "phases": [
    { "id": "partner-setup", "name": "Partner & CPM Setup", "order": 1, "summary": "CP ID, CP User Name, and external identifier creation in CPM", "systems": ["cpm"] },
    { "id": "rights", "name": "Rights & Distribution Rights", "order": 2, "summary": "Rightsline consumes CP external ID and creates distribution rights out", "systems": ["rightsline"] },
    { "id": "avail-pipeline", "name": "EMA Avail Pipeline", "order": 3, "summary": "Falcon publishes avails to S3; DTC Unified Acquisition ingests and maps to catalog", "systems": ["falcon", "dtc-ua", "dtc-catalog"] },
    { "id": "amp-pipeline", "name": "AMP Delivery", "order": 4, "summary": "AMP ordering, SIP delivery to DTC S3, acquisition ingest and CP mapping", "systems": ["amp", "sip", "dtc-ua", "dtc-catalog"] },
    { "id": "av-pipeline", "name": "AV Delivery & Finalization", "order": 5, "summary": "AV mastering/localization via SIP; final CP ID assignment in catalog", "systems": ["sip", "dtc-ua", "dtc-catalog", "content-portal"] },
    { "id": "dtc-delivery", "name": "DTC Platform Delivery", "order": 6, "summary": "Content Portal / CPM handoff to Disney+, ESPN+, and Hulu", "systems": ["content-portal", "dtc"] }
  ],
  "systems": [
    { "id": "cpm", "name": "Content Partner Manager", "short": "CPM", "phase": "partner-setup" },
    { "id": "rightsline", "name": "Rightsline", "short": "Rights & Avails", "phase": "rights" },
    { "id": "falcon", "name": "Falcon", "short": "Distribution Ops Avails", "phase": "avail-pipeline" },
    { "id": "dtc-ua", "name": "DTC Unified Acquisition", "short": "Unified Acquisition", "phase": "avail-pipeline" },
    { "id": "dtc-catalog", "name": "DTC Catalog", "short": "Catalog mapping", "phase": "avail-pipeline" },
    { "id": "amp", "name": "AMP", "short": "Distribution Ops AMP", "phase": "amp-pipeline" },
    { "id": "sip", "name": "SIP", "short": "Distribution Ops AV/AMP", "phase": "amp-pipeline" },
    { "id": "content-portal", "name": "Content Portal", "short": "CPM portal", "phase": "dtc-delivery" },
    { "id": "dtc", "name": "DTC Platforms", "short": "Disney+ · ESPN+ · Hulu", "phase": "dtc-delivery" }
  ],
  "architectureNodes": [
    { "id": "rightsline", "lane": "sources", "name": "Rightsline", "group": "Rights & Avails" },
    { "id": "falcon-src", "lane": "sources", "name": "Falcon", "group": "Rights & Avails" },
    { "id": "amp-src", "lane": "sources", "name": "AMP", "group": "Assets & Media" },
    { "id": "av-src", "lane": "sources", "name": "AV", "group": "Assets & Media" },
    { "id": "sip-src", "lane": "sources", "name": "SIP", "group": "Assets & Media" },
    { "id": "avails", "lane": "objects", "name": "Avails", "group": "Hulu · D+ · ESPN+ Avail" },
    { "id": "content", "lane": "objects", "name": "Content", "group": "AMP & AV packages" },
    { "id": "s3-avails", "lane": "storage", "name": "S3 (Avails)", "group": "Storage" },
    { "id": "s3-content", "lane": "storage", "name": "S3 (Content)", "group": "Storage" },
    { "id": "unified-acquisition", "lane": "dtc", "name": "Unified Acquisition", "group": "Direct To Consumer" },
    { "id": "content-portal-arch", "lane": "dtc", "name": "Content Portal / CPM", "group": "Direct To Consumer" },
    { "id": "dtc-platforms", "lane": "dtc", "name": "DTC", "group": "Disney+ · ESPN+ · Hulu" }
  ],
  "architectureEdges": [
    ["rightsline", "falcon-src"], ["falcon-src", "avails"], ["avails", "s3-avails"],
    ["amp-src", "sip-src"], ["av-src", "sip-src"], ["sip-src", "content"], ["content", "s3-content"],
    ["s3-avails", "unified-acquisition"], ["s3-content", "unified-acquisition"],
    ["unified-acquisition", "content-portal-arch"], ["content-portal-arch", "dtc-platforms"]
  ],
  "workflowSteps": [
    { "id": "ws-01", "phase": "partner-setup", "system": "cpm", "order": 1, "name": "Create CP ID & CP User Name", "summary": "CPM system creates CP ID with CP User Name" },
    { "id": "ws-02", "phase": "partner-setup", "system": "cpm", "order": 2, "name": "CPM team creates CP in CPD", "summary": "New CP in CPM generates CP ID and External Identifier" },
    { "id": "ws-03", "phase": "rights", "system": "rightsline", "order": 3, "name": "Consume CP External ID", "summary": "Rightsline ingests external identifier (auto or manual)" },
    { "id": "ws-04", "phase": "rights", "system": "rightsline", "order": 4, "name": "Create Distribution Rights Out", "summary": "Rights out for Hulu, Disney+, or ESPN+" },
    { "id": "ws-05", "phase": "avail-pipeline", "system": "falcon", "order": 5, "name": "Publish EMA Avail to S3", "summary": "Falcon creates and publishes EMA Avail to existing S3 bucket" },
    { "id": "ws-06", "phase": "avail-pipeline", "system": "falcon", "order": 6, "name": "Send avail payload to DTC Acquisition", "summary": "S3 key, avail location, and CP User Name to DTC UA API" },
    { "id": "ws-07", "phase": "avail-pipeline", "system": "dtc-ua", "order": 7, "name": "Ingest EMA Avail", "summary": "DTC Unified Acquisition ingests avail and hands off to catalog" },
    { "id": "ws-08", "phase": "avail-pipeline", "system": "dtc-catalog", "order": 8, "name": "Map CP User Name in EMA", "summary": "Catalog maps CP User Name to Content ID and ALID" },
    { "id": "ws-09", "phase": "avail-pipeline", "system": "dtc-ua", "order": 9, "name": "Publish acquisition status", "summary": "Status published back to Falcon" },
    { "id": "ws-10", "phase": "avail-pipeline", "system": "falcon", "order": 10, "name": "Update Avail Status", "summary": "Falcon reflects acquisition completion on avail" },
    { "id": "ws-11", "phase": "amp-pipeline", "system": "amp", "order": 11, "name": "Order & release AMP", "summary": "AMP Ops orders, confirms, and releases AMP" },
    { "id": "ws-12", "phase": "amp-pipeline", "system": "sip", "order": 12, "name": "Deliver AMP to DTC S3", "summary": "SIP delivers AMP package to DTC S3 bucket" },
    { "id": "ws-13", "phase": "amp-pipeline", "system": "sip", "order": 13, "name": "Send AMP payload to DTC Acquisition", "summary": "S3 key and AMP MMC location to DTC UA API" },
    { "id": "ws-14", "phase": "amp-pipeline", "system": "dtc-ua", "order": 14, "name": "Ingest AMP", "summary": "Unified Acquisition ingests AMP; catalog maps Content ID to CP User Name" },
    { "id": "ws-15", "phase": "av-pipeline", "system": "sip", "order": 15, "name": "Order & distribute AV", "summary": "Mastering/localization orders AV components using ALID" },
    { "id": "ws-16", "phase": "av-pipeline", "system": "sip", "order": 16, "name": "Deliver AV to DTC S3", "summary": "SIP delivers AV package to DTC S3" },
    { "id": "ws-17", "phase": "av-pipeline", "system": "sip", "order": 17, "name": "Send AV payload to DTC Acquisition", "summary": "S3 key and AV MMC location to DTC UA API" },
    { "id": "ws-18", "phase": "av-pipeline", "system": "dtc-ua", "order": 18, "name": "Ingest AV", "summary": "Unified Acquisition ingests AV for processing" },
    { "id": "ws-19", "phase": "av-pipeline", "system": "dtc-catalog", "order": 19, "name": "Add CP ID from ALID mapping", "summary": "Catalog adds CP ID based on ALID → CP User Name mapping" },
    { "id": "ws-20", "phase": "dtc-delivery", "system": "dtc", "order": 20, "name": "Surface on DTC platforms", "summary": "Content available on Disney+, ESPN+, and Hulu via Content Portal" }
  ],
  "epicIssue": {
    "key": "CPTR-72227",
    "summary": "1st Party Unification Acquisition",
    "url": "https://jira.disney.com/browse/CPTR-72227",
    "jiraStatus": "Unknown",
    "status": "pending",
    "assignee": null,
    "updated": null
  },
  "workItems": [],
  "brief": {
    "vision": "Unify first-party content acquisition across Hulu, Disney+, and ESPN+ through a single DTC Unified Acquisition pipeline fed by Rightsline, Falcon, SIP, and AMP.",
    "scope": [
      "End-to-end partner onboarding (CPM → Rightsline)",
      "EMA Avail ingestion and catalog mapping",
      "AMP and AV delivery via SIP to DTC S3",
      "Unified Acquisition API orchestration per avail and per delivery",
      "Final delivery to DTC platforms via Content Portal"
    ],
    "keyIdentifiers": ["CP ID", "CP User Name", "External Identifier", "ALID", "Content ID", "S3 Key"],
    "risks": [
      "Cross-system identifier mapping (CP User Name ↔ ALID ↔ Content ID)",
      "Falcon ↔ DTC acquisition status loop timing",
      "Parallel AMP and AV delivery dependencies on avail readiness"
    ],
    "references": [
      { "label": "Epic CPTR-72227", "url": "https://jira.disney.com/browse/CPTR-72227" },
      { "label": "Architecture diagram", "path": "assets/architecture-reference.png" },
      { "label": "Swimlane workflow", "path": "assets/swimlane-reference.png" }
    ]
  }
};
