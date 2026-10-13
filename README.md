# Data Catalogue

A small full-stack dataset register with automatic tags and summaries. Built with React, TypeScript, Vite and FastAPI for the Macquarie technical assessment.

## One-command launch

Run `./run.sh` from the repository root. It installs locked dependencies, starts both local servers, checks for port conflicts, and stops both processes on exit. No API key is required in the default mock mode.

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

The optional adapter uses an OpenAI-compatible chat-completions endpoint. Copy `.env.example` to `.env` in the repository root and edit it with your provider settings and private API key, then start `./run.sh`. Alternatively, export the variables below before starting the backend:

```bash
export CURATION_MODE=llm
export LLM_API_KEY=your-key
export LLM_MODEL=your-supported-model
# Optional: export LLM_BASE_URL=https://your-provider.example/v1
```

Never commit credentials. `.env.example` documents the available settings; the backend automatically loads the repository-root `.env`. Exported environment values take precedence.
The adapter separates system instructions from dataset fields, requests JSON, validates the result, and applies a 15-second timeout. A provider or output-validation failure saves the dataset with empty curation fields and sets `curation_status` to `failed`, which the UI displays as a warning. It does not silently substitute a fabricated result.

### Groq configuration and switching models

After copying `.env.example` to the repository-root `.env`, use:

```dotenv
CURATION_MODE=llm
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-20b
LLM_API_KEY=your-private-Groq-key
```

This configuration was verified against Groq for both dataset curation and Ask the catalogue. The `openai/` model prefix identifies the model family; requests are sent to Groq using the Groq key.

One configuration selects one model for both features. To switch models, change `LLM_MODEL` to a supported model ID and restart the backend. To switch compatible providers, change `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL`, then restart. The model must support the chat-completions parameters and JSON Object Mode used by this adapter. There is no in-app model selector. Native Claude is supported through a separate Messages API transport. It is covered by simulated-response tests, but no live Claude connection has been verified.

The private `.env` is ignored by Git; reviewers supply their own credentials. Existing exported environment values override the file, so unset conflicting exports before testing file changes. Switching to `CURATION_MODE=mock` restores the credential-free demo. Restarting resets the in-memory catalogue.

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
- `POST /datasets`: 201 with the created dataset directly, including `curation_status`. A recoverable curation failure sets `curation_status` to `failed`. Missing, blank or oversized input returns 400 with `{ "error": "...", "fields": { ... } }`.
- `DELETE /datasets/{id}`: 200 with `{ "deleted": "id" }`, or 404 for a missing dataset.
- `GET /health`: application health and configured curation mode.

The creation response matches the dataset shape returned by the list endpoint. Each dataset stores `curation_status` (`ok` or `failed`), so failure information survives frontend reloads. All three input fields are required; name/owner limits are 120 characters and description is 4000. UUIDs avoid collisions after deleting seeded numeric IDs. React renders descriptions as text, not HTML.

## Design decisions and limitations

- In-memory storage is explicitly allowed by the brief. It resets on restart and is process-local: run one backend worker. A lock protects concurrent repository operations; callers receive copies.
- Curation is awaited within the creation request, so the form shows progress until the record is saved. For longer workloads, an enterprise version would use background jobs and an explicit curation lifecycle.
- The deterministic mock recognises different data domains and indicators of personal data, producing metadata from the supplied description. It is deliberately transparent and is not a compliance classifier.
- No authentication is included in this assessment. Deploy only with synthetic data. An enterprise version would add identity, role-based access, persistence, audit logs and per-user rate limits.
- Automated tests use mocked provider responses; no API key is needed for those tests or the default demo. A live Groq smoke test on 13 October 2026 successfully created Trade Confirmations with generated tags and summary, then answered its ownership question with a valid dataset source.
- The optional read-only catalogue assistant uses bounded keyword retrieval over live metadata (up to ten sources). Mock mode produces deterministic source-based answers; LLM mode generates an answer with references validated against retrieved IDs. This validation prevents nonexistent source links, but does not prove that every model claim is supported. No embeddings or vector database are needed for this small collection.

## Hosting

Build the frontend with `npm run build` and host `frontend/dist` on a static host. Set `VITE_API_URL` at build time if the API is hosted separately, and set `FRONTEND_ORIGIN` on the backend to that exact frontend origin. Run `uv run uvicorn catalogue.main:app --host 0.0.0.0 --port 8000` behind an HTTPS proxy with a single worker.

## Ask the catalogue

Use the suggested questions or enter your own. Source links reveal and focus the corresponding dataset card, clearing search filters when necessary. The interface labels keyword-demo responses separately from LLM responses and supports follow-up questions, reset and retry. Answers only describe metadata; the app cannot query the underlying dataset records. The separate `ask-preview.html` file remains an explicitly scripted design prototype.

`POST /ask` accepts `{ "question": "...", "previous_questions": [] }` and returns `{ "answer": "...", "sources": [...], "mode": "mock" }`. Questions and history are length-limited; unavailable LLM service or invalid references produce a recoverable 503. Chat history is browser-session state, not durable storage.

### Native Claude setup

Set these values in your private root `.env` and restart:

```dotenv
CURATION_MODE=llm
LLM_PROVIDER=claude
LLM_BASE_URL=https://api.anthropic.com/v1
LLM_MODEL=your-supported-Claude-model-ID
LLM_API_KEY=your-private-Anthropic-key
```

For Groq or OpenAI, use `LLM_PROVIDER=openai-compatible` with the matching endpoint, model and key. Both dataset curation and Ask the catalogue use the selected transport. Claude is asked to return JSON; malformed, empty or truncated responses are rejected by validation, retaining the existing failure behaviour. Live Groq was verified; Claude has only been tested with simulated responses.
