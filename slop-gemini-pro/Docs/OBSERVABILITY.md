# Observability (OpenTelemetry Traces, Metrics & Logs)

KanbanFlow is natively instrumented with **OpenTelemetry** (`telemetry.py`) covering all three signals: **Traces**, **Metrics**, and **Logs**, exported via **OTLP/HTTP** (protobuf over HTTP) or optionally printed to the console for local debugging.

---

## Signals Implemented

### 1. Traces (`TracerProvider`)
- **Automatic HTTP Instrumentation:** Every Flask request (excluding `/healthz` and `/static/*`) creates a server span via `opentelemetry-instrumentation-flask`.
- **Automatic SQLite Instrumentation:** Every SQLite query executed through `database.py` creates a child DB span via `opentelemetry-instrumentation-sqlite3`.
- **Custom Domain Spans:**
  - `kanban.board.get`
  - `kanban.task.create`, `kanban.task.update`, `kanban.task.move`, `kanban.task.delete`
  - `kanban.task.archive`, `kanban.archive.done`, `kanban.task.restore`
  - `kanban.column.create`, `kanban.column.update`, `kanban.column.delete`
- **Trace Correlation Header:** Every HTTP response includes `X-Trace-Id` containing the 32-character hex OpenTelemetry trace ID.

### 2. Metrics (`MeterProvider`)

| Metric Name | Instrument | Unit | Attributes | Description |
| --- | --- | --- | --- | --- |
| `http.server.request.duration` | Histogram | `ms` | `http.request.method`, `http.route`, `http.response.status_code` | HTTP request latency |
| `http.server.requests` | Counter | `1` | `http.request.method`, `http.route`, `http.response.status_code` | Total HTTP requests served |
| `kanban.tasks.created` | Counter | `1` | `priority`, `card_type` | Cards created |
| `kanban.tasks.moved` | Counter | `1` | `target_column_id` | Card move operations |
| `kanban.tasks.deleted` | Counter | `1` | — | Cards deleted |
| `kanban.tasks.archived` | Counter | `1` | — | Done cards archived |
| `kanban.tasks.restored` | Counter | `1` | — | Archived cards restored |
| `kanban.tasks.active` | ObservableGauge | `1` | `column`, `card_type` | Live active cards per column & type |
| `kanban.tasks.archived.total` | ObservableGauge | `1` | — | Live total archived cards |

### 3. Logs (`LoggerProvider` + Structured JSON)
- Python's `kanbanflow` logger is bridged into OpenTelemetry via `OTelLoggingHandler`, automatically attaching `trace_id` and `span_id` to every OTel `LogRecord`.
- Structured JSON logs are also written to `stderr` with `timestamp`, `level`, `logger`, `message`, `trace_id`, `span_id`, and structured domain attributes (`task_id`, `column_id`, `http.method`, `http.duration_ms`).

---

## OTLP Configuration Settings

KanbanFlow uses the standard OpenTelemetry OTLP/HTTP protobuf exporter (`opentelemetry-exporter-otlp-proto-http`). When `OTEL_EXPORTER_OTLP_ENDPOINT` is set, each signal automatically appends its standard OTLP/HTTP path:
- Traces → `<OTEL_EXPORTER_OTLP_ENDPOINT>/v1/traces`
- Metrics → `<OTEL_EXPORTER_OTLP_ENDPOINT>/v1/metrics`
- Logs → `<OTEL_EXPORTER_OTLP_ENDPOINT>/v1/logs`

| Environment Variable | Default | Description |
| --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | *(unset)* | Base OTLP/HTTP collector URL (e.g., `http://127.0.0.1:4318`). No trailing slash needed. |
| `OTEL_EXPORTER_OTLP_HEADERS` | *(unset)* | Comma-separated key=value HTTP headers sent with every OTLP export (e.g., `Authorization=Bearer <token>,X-Tenant-Id=team-a`). |
| `OTEL_EXPORTER_OTLP_TIMEOUT` | `10` | HTTP request timeout (in seconds) for OTLP export calls. |
| `OTEL_EXPORTER_OTLP_COMPRESSION` | *(none)* | Optional payload compression (`gzip` or `none`). |
| `OTEL_EXPORTER_OTLP_CERTIFICATE` | *(system CA)* | Path to a custom TLS CA certificate bundle for self-signed OTLP collectors. |
| `OTEL_SERVICE_NAME` | `kanbanflow` | OpenTelemetry `service.name` resource attribute. |
| `DEPLOYMENT_ENV` | `local` | OpenTelemetry `deployment.environment.name` resource attribute. |
| `OTEL_METRIC_EXPORT_INTERVAL` | `30000` | Periodic metric push interval in milliseconds. |
| `OTEL_CONSOLE_EXPORTER` | `false` | Set to `true` to print raw OTel spans, metrics, and log records to stdout locally. |
| `OTEL_SDK_DISABLED` | `false` | Set to `true` to disable all OTel exporters. |
| `LOG_LEVEL` | `INFO` | Application log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |

---

## Setup Recipes

### 1. Local Debugging (No Collector Required)
Print spans, metrics, and OTel log records directly to the console:

```bash
OTEL_CONSOLE_EXPORTER=true \
OTEL_METRIC_EXPORT_INTERVAL=10000 \
.venv/bin/python app.py
```

### 2. Local All-in-One OTLP Stack (Grafana LGTM)
Spin up a local OTLP collector + Tempo (traces) + Prometheus (metrics) + Loki (logs) + Grafana UI on `http://localhost:3000`:

```bash
# Terminal 1: Start local Grafana OpenTelemetry LGTM stack
docker run --rm -p 3000:3000 -p 4317:4317 -p 4318:4318 grafana/otel-lgtm

# Terminal 2: Start KanbanFlow pointed at OTLP/HTTP (4318)
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318 \
OTEL_SERVICE_NAME=kanbanflow \
DEPLOYMENT_ENV=local \
.venv/bin/python app.py
```

### 3. Authenticated / SaaS OTLP Backend (Grafana Cloud, Honeycomb, Datadog, etc.)

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway.example.com/otlp \
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer <YOUR_TOKEN>" \
OTEL_EXPORTER_OTLP_COMPRESSION=gzip \
OTEL_SERVICE_NAME=kanbanflow \
DEPLOYMENT_ENV=production \
.venv/bin/python app.py
```

### 4. Docker Runtime with OTLP

```bash
docker run --rm -p 8080:8080 -v kanbanflow-data:/data \
  -e OTEL_EXPORTER_OTLP_ENDPOINT=http://host.docker.internal:4318 \
  -e OTEL_SERVICE_NAME=kanbanflow \
  -e DEPLOYMENT_ENV=docker \
  kanbanflow:latest
```

### 5. Kubernetes Cluster Collector
In `k8s/deployment.yaml`, enable `OTEL_EXPORTER_OTLP_ENDPOINT` (and optionally pull `OTEL_EXPORTER_OTLP_HEADERS` from a Kubernetes `Secret`):

```yaml
env:
  - name: KANBAN_DB_PATH
    value: /data/kanban.db
  - name: OTEL_SERVICE_NAME
    value: kanbanflow
  - name: DEPLOYMENT_ENV
    value: production
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://otel-collector.observability.svc.cluster.local:4318
  - name: OTEL_METRIC_EXPORT_INTERVAL
    value: "30000"
  # Optional: pass auth headers from a Secret when exporting outside the cluster
  # - name: OTEL_EXPORTER_OTLP_HEADERS
  #   valueFrom:
  #     secretKeyRef:
  #       name: otlp-credentials
  #       key: headers
```
