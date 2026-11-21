# KanbanFlow — Agent & Harness Guide (`AGENTS.md`)

> **Auto-loaded entrypoint** for Antigravity CLI (`agy`) and cross-harness coding agents (Codex, Cursor, Windsurf, Claude Code, etc.). Deeper handoff context, architecture maps, and runbooks live in [`.agents/`](./.agents/README.md).

## Project Summary
**KanbanFlow** is a lightweight, local-first Kanban board built with **Python (Flask)**, **Jinja2**, **SQLite (`kanban.db`)**, **HTML5**, **CSS3**, and **Vanilla JavaScript** (no frontend build pipeline). It also includes:
- Interactive **OpenAPI 3.1 / Swagger UI** (`/docs`, `/swagger`, `/openapi.json`) with dark-mode parity.
- A zero-dependency JSON-RPC 2.0 stdio **MCP server** (`mcp_server/server.py`, 12 tools, 3 resources).
- **OpenTelemetry** OTLP/HTTP traces, metrics, and trace-correlated logs (`telemetry.py`).
- A local **LangChain + LangGraph + Ollama (`gemma4:12b-mlx`)** MCP agent (`agent-integrations/`).
- Multi-stage non-root **Docker** (`Dockerfile`) and **Kubernetes** (`k8s/deployment.yaml`) deployment manifests.

---

## Python Environments (Important: Two Separate Venvs)

| Purpose | Interpreter | Requirements |
| --- | --- | --- |
| Core web app, MCP server, OTel & core tests | `.venv/bin/python` (Python 3.15.2) | `requirements.txt` |
| Local LangChain + LangGraph Ollama agent & agent tests | `agent-integrations/.venv/bin/python` (Python 3.14.10) | `agent-integrations/requirements.txt` |

Keep `requirements.txt` lean (used by `Dockerfile`). Never mix LangChain/LangGraph dependencies into the root `requirements.txt`.

---

## Essential Commands

```bash
# Run core KanbanFlow web app (http://127.0.0.1:5000, Swagger at /docs)
.venv/bin/python app.py

# Verify core backend, OpenAPI, MCP server & OpenTelemetry (MUST pass with zero warnings)
.venv/bin/python -m py_compile app.py database.py openapi_spec.py telemetry.py mcp_server/server.py tests/test_app.py tests/test_mcp.py tests/test_telemetry.py
.venv/bin/python -W error -m unittest discover -s tests -v

# Verify frontend JS syntax
node --check static/js/app.js

# Verify LangChain + LangGraph + Ollama MCP agent
agent-integrations/.venv/bin/python -m unittest discover -s agent-integrations -v
agent-integrations/.venv/bin/python agent-integrations/cli.py --check
```

---

## Critical Non-Negotiable Invariants

1. **NEVER delete or overwrite `kanban.db`:** The live workspace DB holds user tasks and 20 seeded interconnected demo tasks (4 columns, 23 active tasks). Always add new schema changes as idempotent migrations inside `database.init_db()`.
2. **SQLite connection hygiene (Python 3.15 `-W error`):** Always use `with database.get_connection(db_path) as conn:` (which closes the connection in `finally:`). Never use raw `with sqlite3.connect(...)` — it triggers `ResourceWarning` under `-W error`.
3. **CSS Typography Token Invariant:** In `static/css/style.css`, **zero hardcoded `font-size` or `font-weight` values** are allowed outside `:root` and `[data-theme="dark"]`. Always use the 7-step token scale (`var(--text-2xs)`..`var(--text-xl)`) and weight tokens (`var(--weight-regular)`..`var(--weight-bold)`).
4. **Responsive Grid Custom Property:** `renderBoard()` sets `--board-cols` on `.board-grid` (never inline `style.gridTemplateColumns`), so the mobile single-column tab switcher (`@media (max-width: 768px)`) overrides cleanly.
5. **UI Minimalism:** Keep the board UI clean, minimal, and uncluttered — avoid noisy sidebars or redundant chrome.
6. **OpenTelemetry Safety:** Preserve `_GLOBAL_PROVIDERS_SET`, idempotent `TelemetryContext.shutdown()`, custom `OTelLoggingHandler` (not deprecated `LoggingHandler`), and `set_global_providers=False` in tests.
7. **Sync Contracts on Schema Changes:** When adding/changing fields (e.g., `wip_limit`), update `schema.sql`, `database.py` (including migration), `app.py`, `openapi_spec.py`, and `mcp_server/server.py` together.

---

## Where to Look Next (`.agents/`)

- [`.agents/README.md`](./.agents/README.md) — Orientation & harness compatibility map.
- [`.agents/context/PROJECT_STATE.md`](./.agents/context/PROJECT_STATE.md) — Exact session handoff snapshot (completed features, test baseline, optional follow-ups).
- [`.agents/context/ARCHITECTURE_MAP.md`](./.agents/context/ARCHITECTURE_MAP.md) — File-by-file map of backend, frontend, DB schema, MCP, OTel, and agent integration.
- [`.agents/rules/project-invariants.md`](./.agents/rules/project-invariants.md) — Detailed engineering guardrails and known pitfalls.
- [`.agents/skills/kanbanflow-dev/SKILL.md`](./.agents/skills/kanbanflow-dev/SKILL.md) — Antigravity development & verification runbook skill.
- [`.agents/mcp_config.example.json`](./.agents/mcp_config.example.json) — Ready-to-use MCP server registration template.
