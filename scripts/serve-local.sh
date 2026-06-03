#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${1:-8080}"
echo "Serving at http://localhost:${PORT}/"
echo "Press Ctrl+C to stop."
if command -v open >/dev/null 2>&1; then
  (sleep 0.8 && open "http://localhost:${PORT}/") &
fi
exec python3 -m http.server "$PORT"
