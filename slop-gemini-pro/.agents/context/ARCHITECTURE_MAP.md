# KanbanFlow — Architecture & File Map

Quick cold-start reference for locating symbols, endpoints, tables, tools, and tests.

---

## Core Backend & Database

| File | Key Responsibilities |
| --- | --- |
| `app.py` | Flask application factory (`create_app`), REST API routes (`/api/board`, `/api/columns`, `/api/tasks`, `/api/tasks/<id>/move`, `/api/tasks/<id>/archive`, `/api/tasks/<id>/restore`, `/api/archive`, `/api/archive/done`), UI routes (`/`, `/docs`, `/swagger`, `/openapi.json`, `/healthz`), OTel instrumentation wiring |
| `database.py` | SQLite WAL persistence layer, `@contextmanager get_connection()`, `init_db()` with automatic idempotent migrations, column CRUD (`wip_limit`), task CRUD, move/reorder, `task_blockers` sync, archive/restore, `VALID_PRIORITIES` (`low`,`medium`,`high`,`urgent`), `VALID_CARD_TYPES` (`task`,`blocked`,`blocker`) |
| `schema.sql` | Canonical SQLite DDL: `columns` (`id`, `name`, `slug`, `position`, `wip_limit`), `tasks` (`id`, `column_id`, `title`, `description`, `acceptance_criteria`, `definition_of_done`, `priority`, `card_type`, `due_date`, `position`, `archived_at`, `created_at`, `updated_at`), `task_blockers` (`task_id`, `blocker_id`) |
| `openapi_spec.py` | OpenAPI 3.1.0 spec builder (`build_openapi_spec`) served at `/openapi.json` |
| `telemetry.py` | OpenTelemetry OTLP/HTTP traces, metrics, and trace-correlated logs (`init_telemetry`, `TelemetryContext`, custom `OTelLoggingHandler`, Flask + SQLite3 auto-instrumentation) |

---

## Frontend (Templates, CSS, Vanilla JS)

| File | Key Responsibilities |
| --- | --- |
| `templates/base.html` | HTML5 layout, Google Fonts (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`), theme boot script (`kanban-theme` in `localStorage`) |
| `templates/index.html` | Board header, filter bar, `#mobileColTabs`, `.board-stage` + `.board-grid` + SVG connector overlay, Task Modal (`#taskModalOverlay`), Column Settings Modal (`#columnModalOverlay`), Command Palette (`#cmdPaletteOverlay`), Bulk Action Bar (`#bulkActionBar`), Floating Popover (`#floatingPopover`), Archive Drawer, Undo Toast, `#srAnnouncer` |
| `templates/swagger.html` | Swagger UI (`/docs`, `/swagger`) with `[data-theme="dark"]` CSS overrides and `#swaggerThemeToggle` synced to `kanban-theme` |
| `static/css/style.css` | Light/dark theme variables, 7-step typography token system (`--text-2xs`..`--text-xl`, `--weight-*`, `--tracking-*`, `--leading-*`, `--mono-features`), `--board-cols` grid layout, mobile `<= 768px` tab mode, card/dependency spotlight styles, popovers, command palette, bulk triage bar, archive drawer |
| `static/js/app.js` | Single IIFE managing board state, rendering, drag-and-drop, SVG blocker/blocked connectors + hover/pin spotlight, inline AC/DoD & priority/due-date popovers, unsaved-changes modal guard, keyboard navigation + `⌘K` palette, bulk selection/triage, per-column sort, WIP indicators, mobile tabs, archive drawer, Undo toast, `announce()` (`aria-live="polite"`) |

---

## MCP Server (`mcp_server/`)

| File | Key Responsibilities |
| --- | --- |
| `mcp_server/server.py` | Zero-dependency JSON-RPC 2.0 stdio MCP server (`kanbanflow-mcp` v1.0.0, protocol `2025-03-26` / `2024-11-05`). Exposes **12 tools** (`get_board`, `list_columns`, `list_tasks`, `get_task`, `create_task`, `update_task`, `move_task`, `delete_task`, `list_archived_tasks`, `archive_task`, `archive_done_tasks`, `restore_task`) and **3 resources** (`kanban://board`, `kanban://columns`, `kanban://archive`). Configured via `KANBAN_DB_PATH` and `KANBAN_SEED_SAMPLE_TASKS` |
| `mcp_server/example_client.py` | Reusable `KanbanMCPClient` stdio context manager and runnable lifecycle demo (`--live` or temp DB) |

---

## Local LangChain + LangGraph Agent (`agent-integrations/`)

| File | Key Responsibilities |
| --- | --- |
| `agent-integrations/config.py` | `AgentConfig` (defaults: `gemma4:12b-mlx`, `http://127.0.0.1:11434`, `temperature=0.2`, root `kanban.db`), `check_ollama_health()` |
| `agent-integrations/mcp_bridge.py` | Async `KanbanMCPBridge` spawning `mcp_server/server.py` via `mcp.client.stdio` and loading LangChain tools via `langchain_mcp_adapters.tools.load_mcp_tools` |
| `agent-integrations/agent.py` | `SYSTEM_PROMPT`, `create_ollama_llm()`, `build_kanban_agent()` (`StateGraph(MessagesState)` + `ToolNode` + `tools_condition` + `InMemorySaver`), `run_agent_turn()` |
| `agent-integrations/cli.py` | CLI supporting `--check`, interactive chat (`/board`, `/tools`, `/clear`, `/help`, `/exit`), `--prompt`, `--verbose`, `--temp-db`, `--model`, `--ollama-url`, `--db-path` |
| `agent-integrations/test_agent.py` | 4 end-to-end tests using a scripted tool-calling model + real `mcp_server/server.py` over stdio |

---

## Tests, Deployment & Docs

- **Core Tests (`tests/`):** `test_app.py`, `test_mcp.py`, `test_telemetry.py`
- **Deployment:** `Dockerfile` (multi-stage non-root gunicorn), `.dockerignore`, `k8s/deployment.yaml`
- **Docs (`Docs/`):** `README.md`, `ARCHITECTURE.md`, `USER_GUIDE.md`, `API.md`, `MCP_SERVER.md`, `AGENT_INTEGRATIONS.md`, `OBSERVABILITY.md`, `DEPLOYMENT.md`
