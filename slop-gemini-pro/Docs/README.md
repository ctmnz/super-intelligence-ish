# KanbanFlow Documentation

**KanbanFlow** is a lightweight, local-first Kanban board application built with **Python (Flask)**, **Jinja2**, **SQLite**, **HTML5**, **CSS3**, and **Vanilla JavaScript** — with zero heavy frontend frameworks or build pipelines.

---

## Documentation Index

| Document | Description |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview, directory layout, SQLite schema, migrations, and data flow |
| [USER_GUIDE.md](./USER_GUIDE.md) | Board UI walkthrough, Blocked/Blocker hover spotlight, AC & DoD checklists, Archive drawer, and keyboard shortcuts |
| [API.md](./API.md) | Complete REST API reference, OpenAPI 3.1 / Swagger UI (`/docs`), and `curl` examples |
| [MCP_SERVER.md](./MCP_SERVER.md) | Model Context Protocol (MCP) stdio server, tool/resource catalog, example client, and host configuration |
| [OBSERVABILITY.md](./OBSERVABILITY.md) | OpenTelemetry traces, metrics, and trace-correlated structured logs configuration & metric catalog |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Local development setup, automated tests, Docker multi-stage builds, and Kubernetes deployment |

---

## Key Capabilities

- **4-Column Kanban Workflow:** *Backlog*, *In Progress*, *Review*, and *Done* (plus full Column CRUD API).
- **Rich Task Cards:** Title, description, priority (`low`, `medium`, `high`, `urgent`), due dates, interactive **Acceptance Criteria** and **Definition of Done** checklists, drag-and-drop reordering, and quick-move controls.
- **Blocked & Blocker Card Types:** Link `blocked` cards to their `blocker` cards with interactive hover/pin visual spotlighting (red frames for active blockers, emerald frames for resolved blockers, amber frames for blocked cards, and animated curved SVG arrows).
- **Done Archive:** Save completed tasks out of the **Done** column into a searchable slide-over **Archive** drawer with one-click restore and undo support.
- **OpenAPI 3.1 & Swagger UI:** Live interactive API docs at `/docs` (and `/swagger`) backed by `/openapi.json`.
- **MCP Server & Example Client:** Zero-dependency JSON-RPC 2.0 MCP server in `mcp_server/` for AI agent task automation.
- **Container & Kubernetes Ready:** Multi-stage non-root `Dockerfile`, `/healthz` probe, SQLite WAL mode, and Kubernetes `Deployment`, `Service`, and `PersistentVolumeClaim` manifests.

---

## Quick Start

```bash
# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the web app
python app.py
```

Open:
- **Kanban Board:** http://127.0.0.1:5000/
- **Swagger UI:** http://127.0.0.1:5000/docs
- **OpenAPI Spec:** http://127.0.0.1:5000/openapi.json
- **Health Probe:** http://127.0.0.1:5000/healthz
