# `.agents/` — Workspace Knowledge & Customizations for AI Agents

This directory holds persistent project intelligence, engineering rules, architecture references, and Antigravity CLI (`agy`) workspace customizations so any new session — whether **Antigravity CLI**, **Codex**, **Cursor**, **Claude Code**, or another harness — can resume work immediately without re-discovering the codebase or breaking invariants.

---

## Directory Layout

| Path | Audience / Discovery | Purpose |
| --- | --- | --- |
| [`../AGENTS.md`](../AGENTS.md) | Auto-loaded by Antigravity CLI & most coding harnesses | Concise top-level entrypoint, environments, commands, and critical invariants |
| [`rules/project-invariants.md`](./rules/project-invariants.md) | Auto-discovered by Antigravity CLI (`.agents/rules/*.md`) | Detailed coding guardrails, gotchas, and regression traps learned in prior sessions |
| [`skills/kanbanflow-dev/SKILL.md`](./skills/kanbanflow-dev/SKILL.md) | Progressive-disclosure Antigravity skill (`.agents/skills/*/SKILL.md`) | Step-by-step runbook for making changes, validating CSS tokens, and running all test suites |
| [`context/PROJECT_STATE.md`](./context/PROJECT_STATE.md) | Read on demand at session start | Exact snapshot of completed features, DB state, test baselines, and optional pending polish |
| [`context/ARCHITECTURE_MAP.md`](./context/ARCHITECTURE_MAP.md) | Read on demand before editing | File-by-file map of Flask routes, SQLite schema/migrations, JS state, CSS tokens, MCP tools, OTel, and Ollama agent |
| [`mcp_config.example.json`](./mcp_config.example.json) | Copy into `~/.gemini/config/mcp_config.json` or MCP host | Ready-to-use stdio MCP configuration for `kanbanflow-mcp` |

---

## How Different Harnesses Use This Folder

- **Antigravity CLI (`agy`):** Automatically discovers root `AGENTS.md`, `.agents/rules/*.md`, and `.agents/skills/*/SKILL.md` when launched anywhere inside this repository.
- **Other Harnesses (Claude Code, Codex, Cursor, Windsurf, Aider):** Read root `AGENTS.md` first, then open `.agents/context/PROJECT_STATE.md` and `.agents/context/ARCHITECTURE_MAP.md` as needed.
- **Local LangGraph Agent (`agent-integrations/`):** Uses its own runtime system prompt in `agent-integrations/agent.py` and connects directly to `mcp_server/server.py`.

---

## Keeping This Folder Fresh
When completing a major feature, schema migration, or architectural change, update:
1. [`context/PROJECT_STATE.md`](./context/PROJECT_STATE.md) (baseline test counts, new features, DB state).
2. [`context/ARCHITECTURE_MAP.md`](./context/ARCHITECTURE_MAP.md) (new files, endpoints, or tools).
3. [`rules/project-invariants.md`](./rules/project-invariants.md) (any newly discovered gotchas or fixes).
