---
name: kanbanflow-dev
description: >-
  Runbook for developing, modifying, and verifying KanbanFlow (Flask + SQLite +
  Vanilla JS + MCP + OpenTelemetry + LangGraph Ollama agent). Activate when
  editing backend, frontend, schema, MCP server, or agent-integrations code.
---

# KanbanFlow Development & Verification Skill

Use this workflow whenever modifying code in KanbanFlow.

## 1. Orient Before Editing
- Check [PROJECT_STATE.md](../../context/PROJECT_STATE.md) for current baselines and DB state.
- Check [ARCHITECTURE_MAP.md](../../context/ARCHITECTURE_MAP.md) for file locations.
- Keep `kanban.db` untouched — always use `tempfile.TemporaryDirectory()` in tests and scripts.

## 2. Change Checklist by Layer
- **Schema / Data Model (`schema.sql`, `database.py`):**
  1. Add idempotent migration in `database.init_db()`.
  2. Use `with database.get_connection(db_path) as conn:` exclusively.
  3. Update `app.py`, `openapi_spec.py`, and `mcp_server/server.py` if fields changed.
- **Frontend (`static/css/style.css`, `static/js/app.js`, `templates/`):**
  1. Use typography tokens (`var(--text-*)`, `var(--weight-*)`) for every `font-size` and `font-weight` outside `:root` and `[data-theme="dark"]`.
  2. Never set inline `gridTemplateColumns` on `.board-grid`; use `--board-cols`.
  3. Keep inline popovers updating DOM in-place without calling `refreshBoard()` on every toggle.
- **Agent Integration (`agent-integrations/`):**
  1. Keep dependencies in `agent-integrations/requirements.txt` (do not bloat root `requirements.txt`).
  2. Preserve sibling-import fallbacks (`try: from .config ... except ImportError: from config ...`).

## 3. Mandatory Verification Commands

Run all applicable checks after edits:

```bash
# 1. Core Python syntax + strict warning-free test suite (13 tests)
.venv/bin/python -m py_compile app.py database.py openapi_spec.py telemetry.py mcp_server/server.py tests/test_app.py tests/test_mcp.py tests/test_telemetry.py
.venv/bin/python -W error -m unittest discover -s tests -v

# 2. Frontend JS syntax check
node --check static/js/app.js

# 3. CSS typography token invariant check (expect both lists empty)
.venv/bin/python -c "
import re, pathlib
css = pathlib.Path('static/css/style.css').read_text()
# Strip :root and [data-theme='dark'] blocks
stripped = re.sub(r'(?::root|\[data-theme=\"dark\"\])\s*\{[^}]*\}', '', css)
fs = [m.group(0) for m in re.finditer(r'font-size\s*:\s*([^;]+);', stripped) if not m.group(1).strip().startswith('var(')]
fw = [m.group(0) for m in re.finditer(r'font-weight\s*:\s*([^;]+);', stripped) if not m.group(1).strip().startswith('var(')]
print('Hardcoded font-sizes:', fs)
print('Hardcoded font-weights:', fw)
assert not fs and not fw
"

# 4. Agent integration tests (4 tests)
agent-integrations/.venv/bin/python -m unittest discover -s agent-integrations -v
```

## 4. Handoff Update
If you introduced a new feature, migration, test, or invariant, update `.agents/context/PROJECT_STATE.md` and `.agents/context/ARCHITECTURE_MAP.md` before finishing.
