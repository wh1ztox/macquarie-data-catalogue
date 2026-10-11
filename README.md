# Data Catalogue

A small full-stack dataset register with automatic tags and summaries. Built with React, TypeScript, Vite and FastAPI for the Macquarie technical assessment.

## Run locally

Prerequisites: Node.js 22.12+ (or supported later LTS), npm, Python 3.11+, and [uv](https://docs.astral.sh/uv/).

Terminal 1:

```bash
cd backend
uv sync --group dev
uv run uvicorn catalogue.main:app --reload --port 8000
```

Terminal 2:

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. API documentation is at http://localhost:8000/docs.
The three supplied datasets are loaded automatically. The default keyword curator runs without credentials or network access.

## Tests and build

```bash
cd backend
uv run pytest
cd ../frontend
npm test
npm run build
```

Tests cover seed data, creation/deletion, HTTP validation, failed curation, malformed LLM output, provider timeouts, and frontend create/delete/error journeys.

## Real LLM integration

The optional adapter uses an OpenAI-compatible chat-completions endpoint. Export the variables below before starting the backend:

```bash
export CURATION_MODE=llm
export LLM_API_KEY=your-key
export LLM_MODEL=your-supported-model
# Optional: export LLM_BASE_URL=https://your-provider.example/v1
```

Never commit credentials. `.env.example` documents the available settings; environment files are not loaded implicitly.
The adapter separates system instructions from dataset fields, requests JSON, validates the result, and applies a 15-second timeout. A provider or output-validation failure saves the dataset with empty curation fields and returns a user-visible warning. It does not silently substitute a fabricated result.

## Architecture

```text
React components → useDatasets → typed API client
                              ↓
FastAPI routes → DatasetService → Curator (keyword or LLM)
                         ↓
                DatasetRepository → in-memory store
```

Routes handle HTTP concerns. The service coordinates curation and storage. Typed interfaces isolate the replaceable adapters. App creation injects dependencies, allowing tests to substitute a failed curator and giving each test an independent store.

## API

- `GET /datasets`: 200 with an array of dataset records.
- `POST /datasets`: 201 with `{ "dataset": { ... }, "warning": null }`. A recoverable curation failure sets warning text. Missing, blank or oversized input returns 400 with `{ "error": "...", "fields": { ... } }`.
- `DELETE /datasets/{id}`: 200 with `{ "deleted": "id" }`, or 404 for a missing dataset.
- `GET /health`: application health and configured curation mode.

The creation envelope keeps warnings separate from stored dataset metadata. All three input fields are required; name/owner limits are 120 characters and description is 4000. UUIDs avoid collisions after deleting seeded numeric IDs. React renders descriptions as text, not HTML.

## Design decisions and limitations

- In-memory storage is explicitly allowed by the brief. It resets on restart and is process-local: run one backend worker. A lock protects concurrent repository operations; callers receive copies.
- Curation is awaited within the creation request, so the form shows progress until the record is saved. For longer workloads, an enterprise version would use background jobs and an explicit curation lifecycle.
- The deterministic mock recognises different data domains and indicators of personal data, producing metadata from the supplied description. It is deliberately transparent and is not a compliance classifier.
- No authentication is included in this assessment. Deploy only with synthetic data. An enterprise version would add identity, role-based access, persistence, audit logs and per-user rate limits.
- The LLM adapter is exercised with mocked provider responses in tests; no paid live model call is required for the demo.
- Chat and semantic search are outside the required scope. The registered data and API are the foundation for a later catalogue assistant.

## Hosting

Build the frontend with `npm run build` and host `frontend/dist` on a static host. Set `VITE_API_URL` at build time if the API is hosted separately, and set `FRONTEND_ORIGIN` on the backend to that exact frontend origin. Run `uv run uvicorn catalogue.main:app --host 0.0.0.0 --port 8000` behind an HTTPS proxy with a single worker.
