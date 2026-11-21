# KanbanFlow — Project State Handoff

**Snapshot Date:** 2026-11-21
**Workspace Path:** `/Users/danielstoinov/GOOLGE-AI/antigravity/initial-tests/kanban-try-agy`

---

## Current Status: Clean & All Tests Passing

Every feature requested so far is implemented, verified, and passing tests with zero regressions.

### Verified Test Baselines
- **Core Test Suite (13/13 OK, 0 warnings):**
  ```bash
  .venv/bin/python -W error -m unittest discover -s tests -v
  ```
  - `tests/test_app.py` — 10 tests (board rendering, CRUD, drag/move, column CRUD + `wip_limit`, AC/DoD checklists, blocked/blocker types & links, archive/restore, OpenAPI/Swagger, legacy DB migration, `/healthz`).
  - `tests/test_mcp.py` — 2 tests (MCP handshake, 12 tools, 3 resources, full task + archive lifecycle).
  - `tests/test_telemetry.py` — 1 test (OTel spans, metrics, and trace-correlated logs).
- **Agent Integration Suite (4/4 OK):**
  ```bash
  agent-integrations/.venv/bin/python -m unittest discover -s agent-integrations -v
  ```
  - `agent-integrations/test_agent.py` — 4 tests (`AgentConfig` defaults for `gemma4:12b-mlx`, real `mcp_server/server.py` stdio bridge loading all 12 LangChain tools + `kanban://board`, rich task creation via LangGraph, linked blocker/blocked creation + multi-turn follow-up move).
- **Static Checks:**
  - `py_compile` passes across all root, `mcp_server/`, `tests/`, and `agent-integrations/` Python modules.
  - `node --check static/js/app.js` passes.
  - CSS typography audit confirms `0` hardcoded `font-size` and `0` hardcoded `font-weight` values outside `:root` and `[data-theme="dark"]`.

---

## Completed Feature Inventory

1. **Core Kanban Web App (`app.py`, `database.py`, `schema.sql`, `templates/`, `static/`):**
   - 4 default columns (`Backlog`, `In Progress`, `Review`, `Done`) + full Column CRUD & WIP limits (`columns.wip_limit`).
   - Rich task cards: priority (`low`/`medium`/`high`/`urgent`), card types (`task`/`blocked`/`blocker`), `task_blockers` dependency graph with hover/pin visual frames and animated SVG connectors, interactive AC & DoD checklists, due dates, drag-and-drop, Undo toast.
   - Polished **Done Archive** slide-over drawer: chronological date grouping, cycle time, due-date outcome badges, expandable full inspection, restore to any column, two-step delete confirmation.
   - **Typography Token System:** 7-step scale (`--text-2xs`..`--text-xl`), weight/tracking/leading tokens, Google Fonts (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`).
   - **All 10 UX/UI Improvements Completed:**
     1. Unsaved-changes guard on modal dismiss (`Keep editing` / `Discard`).
     2. Off-screen & filtered dependency handling (`Show all`, `Jump to card` pulse).
     3. One-click `Unblock` action when all blockers are in `Done` + inline AC/DoD checklist popover directly from card pills.
     4. Column WIP limits (`count/limit` + `.is-over-wip` highlight).
     5. Mobile-first single-column tab switcher (`<= 768px`, `#mobileColTabs`).
     6. Keyboard card navigation (`↑`/`↓`/`←`/`→`, `Shift+←`/`→`, `Enter`) + `⌘K` / `Ctrl+K` Command Palette (`#cmdPaletteOverlay`).
     7. Bulk card selection (`Shift+Click` / `Cmd/Ctrl+Click`) + floating bottom triage bar (`#bulkActionBar`).
     8. Column `⋯` menu: per-column sort (Manual/Priority/Due date), Column Settings & WIP modal (`#columnModalOverlay`), Add/Delete custom columns.
     9. Inline Priority & Due-Date quick-picker popovers (`#floatingPopover`).
     10. Swagger UI dark-mode parity (`/docs`, `/swagger`, `#swaggerThemeToggle` synced with `kanban-theme`) + `aria-live="polite"` screen-reader announcer (`#srAnnouncer`).
2. **OpenAPI 3.1 & Swagger UI (`openapi_spec.py`, `templates/swagger.html`):** Full spec including `wip_limit` on `Column`, `ColumnCreate`, `ColumnUpdate`.
3. **Zero-Dependency MCP Server (`mcp_server/server.py`, `mcp_server/example_client.py`):** 12 tools + 3 resources over JSON-RPC 2.0 stdio.
4. **OpenTelemetry Observability (`telemetry.py`):** OTLP/HTTP traces, metrics, and trace-correlated logs with `OTEL_*` config.
5. **Container & K8s Deployment (`Dockerfile`, `.dockerignore`, `k8s/deployment.yaml`):** Multi-stage non-root image, `/healthz` probe, PVC-backed SQLite.
6. **Local LangChain + LangGraph + Ollama MCP Agent (`agent-integrations/`):** Defaults to `gemma4:12b-mlx` at `http://127.0.0.1:11434`, spawns `mcp_server/server.py` over stdio, supports `--check`, interactive chat, `--prompt`, `--verbose`, and `--temp-db`.
7. **Documentation (`Docs/` & `agent-integrations/README.md`):** Architecture, User Guide, API, MCP Server, Agent Integrations, Observability, Deployment.

---

## Live Workspace Database State (`kanban.db`)
- **Schema:** Auto-migrated to latest (includes `card_type`, `acceptance_criteria`, `definition_of_done`, `archived_at`, `task_blockers`, `columns.wip_limit`).
- **Contents:** 4 columns and **23 active tasks** (original tasks + 20 seeded interconnected tasks covering blocked/blocker chains and diverse scenarios).
- **Rule:** Never overwrite or reset `kanban.db`.

---

## Known Minor / Optional Follow-Ups (Not Blocking Anything)
- `Docs/USER_GUIDE.md`, `Docs/API.md`, and `Docs/ARCHITECTURE.md` were written prior to the 10 UX/UI improvements and do not yet document the newest UI shortcuts/features (`wip_limit`, `⌘K` Command Palette, bulk triage bar, column `⋯` menu, inline quick-pickers, mobile tabs). Update them if the user asks to refresh docs.
- Live Ollama end-to-end execution with `gemma4:12b-mlx` was not invoked from inside the sandbox (sandbox blocks localhost TCP `127.0.0.1:11434`); the user can verify live model connectivity anytime with `agent-integrations/.venv/bin/python agent-integrations/cli.py --check`.
