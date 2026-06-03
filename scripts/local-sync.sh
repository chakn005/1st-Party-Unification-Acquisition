#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m pip install -q -r requirements-sync.txt
python3 scripts/sync-from-jira.py
