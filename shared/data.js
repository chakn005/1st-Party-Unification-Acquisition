/* Auto-generated from data.json — run scripts/sync-from-jira.py */
window.ACQUISITION_DATA = {
  "program": "1st Party Unification Acquisition",
  "epic": {
    "key": "CPTR-72227",
    "summary": "1st Party DTC Unified Acquisition \u2013 QA Coverage & Traceability",
    "url": "https://jira.disney.com/browse/CPTR-72227",
    "jiraStatus": "In Progress",
    "status": "in-progress",
    "assignee": "Niloy Chakraborty",
    "updated": "2026-06-03"
  },
  "milestones": [
    {
      "id": "milestone1",
      "name": "Milestone 1",
      "subtitle": "SIP test plan \u2014 partner setup through avail ingestion & S3 handoff",
      "workflowZoneIds": [
        "partner",
        "avail",
        "storage-in"
      ],
      "testPlan": {
        "id": "DMEDNINJA-17790",
        "milestoneId": "milestone1",
        "name": "SIP - 1st Party Acquisition - Milestone_1",
        "shortName": "Milestone_1",
        "url": "https://jira.disney.com/browse/DMEDNINJA-17790",
        "jiraStatus": "In Progress",
        "status": "in-progress",
        "executionStatus": "in-progress",
        "coverage": 100,
        "pass": 19,
        "fail": 0,
        "blocked": 0,
        "inProgress": 0,
        "pending": 0,
        "total": 19,
        "updated": "2026-06-03",
        "assignee": "Arsheya Sardar",
        "issueType": "Test Plan"
      },
      "linkedTestPlans": []
    },
    {
      "id": "milestone2",
      "name": "Milestone 2",
      "subtitle": "SIP test plan \u2014 AV delivery, catalog finalization, DTC surfacing",
      "workflowZoneIds": [
        "av-delivery",
        "dtc-out"
      ],
      "testPlan": {
        "id": "DMEDNINJA-17818",
        "milestoneId": "milestone2",
        "name": "SIP - 1st Party Acquisition - Milestone_2",
        "shortName": "Milestone_2",
        "url": "https://jira.disney.com/browse/DMEDNINJA-17818",
        "jiraStatus": "In Progress",
        "status": "in-progress",
        "executionStatus": "in-progress",
        "coverage": 100,
        "pass": 3,
        "fail": 0,
        "blocked": 0,
        "inProgress": 0,
        "pending": 0,
        "total": 3,
        "updated": "2026-06-03",
        "assignee": "Arsheya Sardar",
        "issueType": "Test Plan"
      },
      "linkedTestPlans": [
        {
          "id": "RIGHTS-28094",
          "milestoneId": "milestone2",
          "name": "DTCFalcon-Capex-Version 26-06-TBD: Falcon Track 2 Delta Gemini Release",
          "shortName": "DTCFalcon-Capex-Version 26-06-TBD: Falcon Track 2 Delta Gemini Release",
          "url": "https://jira.disney.com/browse/RIGHTS-28094",
          "jiraStatus": "In Progress",
          "status": "in-progress",
          "executionStatus": "in-progress",
          "coverage": 8,
          "pass": 23,
          "fail": 0,
          "blocked": 0,
          "inProgress": 0,
          "pending": 264,
          "total": 287,
          "updated": "2026-06-03",
          "assignee": "Vijay Gajendra",
          "issueType": "Test Plan"
        },
        {
          "id": "RIGHTS-28225",
          "milestoneId": "milestone2",
          "name": "FDA - Test Plan - 26-06-24 FDA Delta Gemini Release 8.0.0",
          "shortName": "26-06-24 FDA Delta Gemini Release 8.0.0",
          "url": "https://jira.disney.com/browse/RIGHTS-28225",
          "jiraStatus": "In Progress",
          "status": "in-progress",
          "executionStatus": "in-progress",
          "coverage": 100,
          "pass": 23,
          "fail": 0,
          "blocked": 0,
          "inProgress": 0,
          "pending": 0,
          "total": 23,
          "updated": "2026-06-03",
          "assignee": "Smrithi Ravindranath",
          "issueType": "Test Plan"
        },
        {
          "id": "RIGHTS-28328",
          "milestoneId": "milestone2",
          "name": "RMS-MD-Unified Acquisition Release 5.0.0 \"26-MM-DD \"",
          "shortName": "RMS-MD-Unified Acquisition Release 5.0.0 \"26-MM-DD \"",
          "url": "https://jira.disney.com/browse/RIGHTS-28328",
          "jiraStatus": "In Progress",
          "status": "in-progress",
          "executionStatus": "in-progress",
          "coverage": 21,
          "pass": 22,
          "fail": 0,
          "blocked": 0,
          "inProgress": 0,
          "pending": 84,
          "total": 106,
          "updated": "2026-06-03",
          "assignee": "Anush Kadam",
          "issueType": "Test Plan"
        }
      ]
    },
    {
      "id": "amp",
      "name": "AMP",
      "subtitle": "AMP test plan \u2014 order, SIP delivery, unified acquisition ingest",
      "workflowZoneIds": [
        "amp-path"
      ],
      "testPlan": {
        "id": "OMFG-19970",
        "milestoneId": "amp",
        "name": "AMP - 1st Party Acquisition",
        "shortName": "1st Party Acquisition",
        "url": "https://jira.disney.com/browse/OMFG-19970",
        "jiraStatus": "In Progress",
        "status": "in-progress",
        "executionStatus": "in-progress",
        "coverage": 50,
        "pass": 3,
        "fail": 0,
        "blocked": 0,
        "inProgress": 0,
        "pending": 3,
        "total": 6,
        "updated": "2026-06-03",
        "assignee": "Pooja Bullapura Channabasappa",
        "issueType": "Test Plan"
      },
      "linkedTestPlans": []
    }
  ],
  "relatedTestPlans": [],
  "programRollup": {
    "status": "in-progress",
    "coverage": 21,
    "pass": 93,
    "fail": 0,
    "pending": 351,
    "total": 444,
    "milestonesComplete": 0,
    "milestoneTotal": 6,
    "planCount": 6,
    "plansComplete": 0
  },
  "consolidatedWorkflow": {
    "title": "End-to-end acquisition (architecture + implementation)",
    "zones": [
      {
        "id": "partner",
        "name": "Partner & Rights",
        "order": 1
      },
      {
        "id": "avail",
        "name": "Avail pipeline",
        "order": 2
      },
      {
        "id": "storage-in",
        "name": "Storage & ingest",
        "order": 3
      },
      {
        "id": "amp-path",
        "name": "AMP delivery",
        "order": 4
      },
      {
        "id": "av-delivery",
        "name": "AV delivery",
        "order": 5
      },
      {
        "id": "dtc-out",
        "name": "DTC delivery",
        "order": 6
      }
    ],
    "nodes": [
      {
        "id": "cpm",
        "zone": "partner",
        "order": 1,
        "name": "CPM",
        "systems": [
          "CPM"
        ],
        "summary": "Create CP ID, CP User Name, and External Identifier in CPD"
      },
      {
        "id": "rightsline",
        "zone": "partner",
        "order": 2,
        "name": "Rightsline",
        "systems": [
          "Rightsline"
        ],
        "summary": "Consume CP External ID; create Distribution Rights Out (Hulu, D+, ESPN+)"
      },
      {
        "id": "falcon-avail",
        "zone": "avail",
        "order": 3,
        "name": "Falcon",
        "systems": [
          "Falcon"
        ],
        "summary": "Publish EMA Avail to S3; invoke DTC Acquisition API with CP User Name"
      },
      {
        "id": "avails-object",
        "zone": "avail",
        "order": 4,
        "name": "Avails",
        "systems": [
          "Hulu",
          "D+",
          "ESPN+ Avail"
        ],
        "summary": "Platform avail objects produced from rights & avails source"
      },
      {
        "id": "s3-avail",
        "zone": "storage-in",
        "order": 5,
        "name": "S3 (Avails)",
        "systems": [
          "Storage"
        ],
        "summary": "Avail packages land in DTC S3 bucket"
      },
      {
        "id": "dtc-ua-avail",
        "zone": "storage-in",
        "order": 6,
        "name": "Unified Acquisition",
        "systems": [
          "DTC UA"
        ],
        "summary": "Ingest EMA Avail; hand off to catalog for CP User Name \u2192 Content ID / ALID mapping"
      },
      {
        "id": "dtc-catalog-avail",
        "zone": "storage-in",
        "order": 7,
        "name": "DTC Catalog",
        "systems": [
          "Catalog"
        ],
        "summary": "Map identifiers; publish acquisition status back to Falcon"
      },
      {
        "id": "falcon-status",
        "zone": "avail",
        "order": 8,
        "name": "Falcon status",
        "systems": [
          "Falcon"
        ],
        "summary": "Update avail status after acquisition loop"
      },
      {
        "id": "amp-order",
        "zone": "amp-path",
        "order": 9,
        "name": "AMP",
        "systems": [
          "AMP"
        ],
        "summary": "Order, confirm, and release AMP"
      },
      {
        "id": "sip-amp",
        "zone": "amp-path",
        "order": 10,
        "name": "SIP \u2192 S3",
        "systems": [
          "SIP"
        ],
        "summary": "Deliver AMP to DTC S3; invoke acquisition API per delivery"
      },
      {
        "id": "dtc-ua-amp",
        "zone": "amp-path",
        "order": 11,
        "name": "UA ingest AMP",
        "systems": [
          "DTC UA",
          "Catalog"
        ],
        "summary": "Ingest AMP; map Content ID to CP User Name"
      },
      {
        "id": "sip-av-order",
        "zone": "av-delivery",
        "order": 12,
        "name": "SIP AV",
        "systems": [
          "SIP",
          "AV"
        ],
        "summary": "Mastering/localization; distribute AV components by ALID"
      },
      {
        "id": "sip-av-deliver",
        "zone": "av-delivery",
        "order": 13,
        "name": "AV \u2192 S3",
        "systems": [
          "SIP"
        ],
        "summary": "Deliver AV package to DTC S3; acquisition API per delivery"
      },
      {
        "id": "dtc-ua-av",
        "zone": "av-delivery",
        "order": 14,
        "name": "UA ingest AV",
        "systems": [
          "DTC UA"
        ],
        "summary": "Ingest AV for processing"
      },
      {
        "id": "catalog-final",
        "zone": "av-delivery",
        "order": 15,
        "name": "Catalog finalize",
        "systems": [
          "Catalog"
        ],
        "summary": "Add CP ID from ALID \u2192 CP User Name mapping"
      },
      {
        "id": "content-portal",
        "zone": "dtc-out",
        "order": 16,
        "name": "Content Portal",
        "systems": [
          "CPM Portal"
        ],
        "summary": "Content Portal / CPM handoff (CP User Name feedback to rights)"
      },
      {
        "id": "dtc-platforms",
        "zone": "dtc-out",
        "order": 17,
        "name": "DTC",
        "systems": [
          "Disney+",
          "ESPN+",
          "Hulu"
        ],
        "summary": "Client-ready content on DTC platforms"
      }
    ],
    "feeds": [
      {
        "from": "rightsline",
        "to": "falcon-avail",
        "label": "DRO"
      },
      {
        "from": "falcon-avail",
        "to": "avails-object",
        "to2": "s3-avail",
        "label": "EMA"
      },
      {
        "from": "s3-avail",
        "to": "dtc-ua-avail"
      },
      {
        "from": "dtc-ua-avail",
        "to": "dtc-catalog-avail"
      },
      {
        "from": "dtc-catalog-avail",
        "to": "falcon-status",
        "label": "status",
        "dashed": true
      },
      {
        "from": "amp-order",
        "to": "sip-amp"
      },
      {
        "from": "sip-amp",
        "to": "dtc-ua-amp"
      },
      {
        "from": "sip-av-order",
        "to": "sip-av-deliver"
      },
      {
        "from": "sip-av-deliver",
        "to": "dtc-ua-av"
      },
      {
        "from": "dtc-ua-av",
        "to": "catalog-final"
      },
      {
        "from": "catalog-final",
        "to": "content-portal"
      },
      {
        "from": "content-portal",
        "to": "dtc-platforms"
      }
    ],
    "milestoneByZone": {
      "partner": "milestone1",
      "avail": "milestone1",
      "storage-in": "milestone1",
      "amp-path": "amp",
      "av-delivery": "milestone2",
      "dtc-out": "milestone2"
    }
  },
  "statusLabels": {
    "completed": {
      "label": "Complete",
      "class": "status-completed"
    },
    "in-progress": {
      "label": "In Progress",
      "class": "status-progress"
    },
    "pending": {
      "label": "Not Started",
      "class": "status-pending"
    },
    "blocked": {
      "label": "Blocked",
      "class": "status-blocked"
    },
    "fail": {
      "label": "Failed",
      "class": "status-fail"
    }
  },
  "jira": {
    "baseUrl": "https://jira.disney.com",
    "browsePath": "/browse/",
    "epicKey": "CPTR-72227",
    "lastSynced": "2026-06-03T12:35:57Z",
    "syncRequired": false,
    "syncTestPlans": [
      "DMEDNINJA-17790",
      "DMEDNINJA-17818",
      "OMFG-19970"
    ],
    "dataVersion": "20260603123557",
    "syncSource": "scripts/sync-from-jira.py"
  }
};
