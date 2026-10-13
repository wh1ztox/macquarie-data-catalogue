#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
command -v uv >/dev/null || { echo 'Install uv before running this project.'; exit 1; }
command -v npm >/dev/null || { echo 'Install Node.js and npm before running this project.'; exit 1; }
for port in 8000 5173; do
  if lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Port $port is already in use. Stop that server before running ./run.sh."
    exit 1
  fi
done
(cd "$ROOT/backend" && uv sync --locked --group dev)
(cd "$ROOT/frontend" && npm ci)
# Start each process directly so cleanup targets the servers rather than subshells.
cd "$ROOT/backend"
.venv/bin/python -m uvicorn catalogue.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd "$ROOT/frontend"
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort &
FRONTEND_PID=$!
cleanup() { kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
printf 'Data Catalogue: http://127.0.0.1:5173/\nAPI docs: http://127.0.0.1:8000/docs\n'
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do sleep 1; done
exit 1
