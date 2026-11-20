# KanbanFlow

A lightweight, local-first Kanban board built with **Python (Flask)**, **Jinja2**, **SQLite**, **HTML5**, **CSS3**, and **Vanilla JavaScript**.

## Features
- **4-Column Board:** *Backlog*, *In Progress*, *Review*, and *Done* (plus full Column CRUD API).
- **Rich Task Management:** Create, edit, delete (with Undo), drag-and-drop reorder, quick-move across columns, interactive **Acceptance Criteria** & **Definition of Done** checklists, and due dates.
- **Blocked & Blocker Dependencies:** Link `blocked` cards to `blocker` cards with interactive hover/pin visual frames and animated SVG connectors.
- **Done Archive:** Save completed cards into a searchable slide-over **Archive** drawer with one-click restore.
- **OpenAPI / Swagger UI:** Interactive API docs at `/docs` (and `/swagger`) backed by `/openapi.json`.
- **MCP Server:** Zero-dependency JSON-RPC 2.0 stdio MCP server & example client in [`mcp_server/`](./mcp_server/).
- **OpenTelemetry Observability:** Built-in OTLP/HTTP **Traces**, **Metrics**, and trace-correlated **Logs** (`telemetry.py`).
- **Docker & Kubernetes Ready:** Multi-stage non-root `Dockerfile`, `/healthz` probe, and `k8s/deployment.yaml`.

---

## Setup & Run

```bash
# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the local server
python app.py
```

Open:
- **Kanban Board:** [http://127.0.0.1:5000](http://127.0.0.1:5000)
- **Swagger UI:** [http://127.0.0.1:5000/docs](http://127.0.0.1:5000/docs)
- **OpenAPI Spec:** [http://127.0.0.1:5000/openapi.json](http://127.0.0.1:5000/openapi.json)

---

## OpenTelemetry (OTLP) Settings

KanbanFlow exports **Traces**, **Metrics**, and **Logs** over **OTLP/HTTP** (protobuf) using standard `OTEL_*` environment variables:

| Environment Variable | Default | Description |
| --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | *(unset)* | Base OTLP/HTTP collector URL (e.g. `http://127.0.0.1:4318`). Sends to `/v1/traces`, `/v1/metrics`, and `/v1/logs`. |
| `OTEL_EXPORTER_OTLP_HEADERS` | *(unset)* | Optional comma-separated auth/custom headers (e.g. `Authorization=Bearer <token>`). |
| `OTEL_EXPORTER_OTLP_TIMEOUT` | `10` | Exporter HTTP timeout in seconds. |
| `OTEL_SERVICE_NAME` | `kanbanflow` | Logical `service.name` resource attribute. |
| `DEPLOYMENT_ENV` | `local` | `deployment.environment.name` resource attribute (e.g. `staging`, `production`). |
| `OTEL_METRIC_EXPORT_INTERVAL` | `30000` | Metric push interval in milliseconds. |
| `OTEL_CONSOLE_EXPORTER` | `false` | Set to `true` to print raw OTel spans, metrics, and log records to stdout for local debugging. |
| `OTEL_SDK_DISABLED` | `false` | Set to `true` to disable all OpenTelemetry exporters. |
| `LOG_LEVEL` | `INFO` | Python logger level (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |

### Examples

```bash
# Export traces, metrics, and logs to a local OTel Collector (port 4318)
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318 \
OTEL_SERVICE_NAME=kanbanflow \
DEPLOYMENT_ENV=local \
python app.py

# Export to a hosted OTLP backend requiring an API token header
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.example.com \
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer YOUR_API_TOKEN" \
OTEL_SERVICE_NAME=kanbanflow \
DEPLOYMENT_ENV=production \
python app.py

# Local debugging without a collector (prints OTel telemetry to terminal)
OTEL_CONSOLE_EXPORTER=true python app.py

# Docker container with OTLP export enabled
docker run --rm -p 8080:8080 -v kanbanflow-data:/data \
  -e OTEL_EXPORTER_OTLP_ENDPOINT=http://host.docker.internal:4318 \
  -e OTEL_SERVICE_NAME=kanbanflow \
  -e DEPLOYMENT_ENV=docker \
  kanbanflow:latest
```

For full metrics catalogs, collector setup, and Kubernetes OTLP configuration, see [`Docs/OBSERVABILITY.md`](./Docs/OBSERVABILITY.md).

---

## Documentation & Tests

Full documentation is available in [`Docs/`](./Docs/README.md).

```bash
# Run all automated tests (API, Archive, AC/DoD, OpenAPI, MCP, and OpenTelemetry)
.venv/bin/python -W error -m unittest discover -s tests -v
```
