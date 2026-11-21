# KanbanFlow Project Rules & Engineering Invariants

Follow these project-specific rules whenever reading, editing, or testing this repository.

## 1. Database & Migration Safety
- **Preserve `kanban.db`:** Never delete, reset, or truncate `kanban.db` at the workspace root. All tests must use `tempfile.TemporaryDirectory()`.
- **Idempotent Migrations Only:** Whenever adding columns or tables to `schema.sql`, also add a backward-compatible migration in `database.init_db()` (checking `PRAGMA table_info(...)` before `ALTER TABLE`).
- **Always Use `database.get_connection()`:** Never open raw `with sqlite3.connect(...)` blocks. In Python 3.15 under `-W error`, SQLite's context manager commits/rolls back without closing the connection, causing `ResourceWarning: unclosed database`. `database.get_connection()` closes cleanly in `finally:`.
- **SQLite WAL Mode:** Keep WAL journal mode and foreign keys enabled for concurrent access between `app.py` (Flask) and `mcp_server/server.py` (stdio MCP).

## 2. Frontend (HTML / CSS / Vanilla JS)
- **Zero Hardcoded CSS Typography:** Every `font-size` and `font-weight` declaration in `static/css/style.css` outside `:root` and `[data-theme="dark"]` MUST reference a design token (`var(--text-2xs)`..`var(--text-xl)`, `var(--weight-regular)`..`var(--weight-bold)`).
- **Responsive Board Grid:** Never set `boardGrid.style.gridTemplateColumns` inline in `static/js/app.js`. Always set `--board-cols` (`boardGrid.style.setProperty("--board-cols", String(count))`) so `@media (max-width: 768px)` single-column tab mode continues to work cleanly.
- **Inline Checklist Popover Stability:** `openInlineChecklistPopover()` in `static/js/app.js` must patch `/api/tasks/<id>` directly and update the card's AC/DoD pill in-place (with rollback on error) — do NOT route it through `refreshBoard()` which closes floating popovers after one click.
- **No Unnecessary Heavy Frameworks:** Keep the frontend zero-build Vanilla JS + Jinja2 + CSS3. Keep the visual design clean, minimal, and uncluttered.
- **Keep Shared Constants Hoisted:** In `static/js/app.js`, keep shared constants like `PRIORITY_RANK` hoisted near the top of the IIFE before any helpers that read them.

## 3. OpenTelemetry & Test Warning Hygiene
- **Zero Warnings in Core Suite:** `.venv/bin/python -W error -m unittest discover -s tests -v` MUST pass with 0 warnings.
- **OTel Pitfalls Already Solved (Do Not Regress):**
  - Use the custom `OTelLoggingHandler` in `telemetry.py` (`logger_provider.get_logger(...).emit(...)`) instead of the deprecated `opentelemetry.sdk._logs.LoggingHandler`.
  - Preserve `_GLOBAL_PROVIDERS_SET` guard and idempotent `TelemetryContext.shutdown()`.
  - Pass `set_global_providers=False` when initializing telemetry inside unit tests.
- **Flask Static File Client Warning:** If running ad-hoc Flask test-client smoke checks against `/static/...`, wrap `client.get(...)` in a `with` block (`with client.get(...) as resp:`) to avoid `ResourceWarning: unclosed file`.

## 4. MCP Server & Local LangGraph Agent
- **Zero-Dependency MCP Server:** Keep `mcp_server/server.py` pure Python stdlib + `database.py` so any host (`python3`, `.venv/bin/python`, `agent-integrations/.venv/bin/python`) can run it without extra installs.
- **Isolated Agent Venv:** Keep LangChain/LangGraph/Ollama/MCP-adapter packages in `agent-integrations/requirements.txt` and `agent-integrations/.venv` (Python 3.14), separate from root `requirements.txt` (used by `Dockerfile`).
- **Dual-Mode Imports in `agent-integrations/`:** Because the folder name contains a hyphen, keep the `try: from .config ... except ImportError: from config ...` fallback in `mcp_bridge.py` and `agent.py` so `python agent-integrations/cli.py` works directly.
- **Agent Tests:** Third-party `langsmith` emits a Python 3.14 `DeprecationWarning` on `asyncio.iscoroutinefunction`, so run agent tests without `-W error`: `agent-integrations/.venv/bin/python -m unittest discover -s agent-integrations -v`.
