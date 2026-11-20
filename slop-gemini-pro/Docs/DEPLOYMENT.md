# Development, Testing & Deployment

---

## Environment Variables

### Core Application

| Variable | Default | Description |
| --- | --- | --- |
| `KANBAN_DB_PATH` | `./kanban.db` | Path to the SQLite database file (parent directories are created automatically) |
| `HOST` | `127.0.0.1` | Bind host when running `python app.py` |
| `PORT` | `5000` (`8080` in Docker) | HTTP listen port |
| `FLASK_DEBUG` | `1` | Enables Flask debug reloader when running `app.py` directly |
| `KANBAN_SEED_SAMPLE_TASKS` | `1` | Set to `0` in MCP server to initialize an empty board without starter tasks |

### OpenTelemetry (OTLP)

| Variable | Default | Description |
| --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | *(unset)* | Base OTLP/HTTP collector URL (e.g., `http://otel-collector:4318`); exports `/v1/traces`, `/v1/metrics`, `/v1/logs` |
| `OTEL_EXPORTER_OTLP_HEADERS` | *(unset)* | Optional comma-separated auth/custom headers (e.g., `Authorization=Bearer <token>`) |
| `OTEL_EXPORTER_OTLP_TIMEOUT` | `10` | OTLP HTTP export timeout in seconds |
| `OTEL_EXPORTER_OTLP_COMPRESSION` | *(none)* | Optional compression (`gzip` or `none`) |
| `OTEL_SERVICE_NAME` | `kanbanflow` | `service.name` resource attribute |
| `DEPLOYMENT_ENV` | `local` | `deployment.environment.name` resource attribute |
| `OTEL_METRIC_EXPORT_INTERVAL` | `30000` | Metric export interval in milliseconds |
| `OTEL_CONSOLE_EXPORTER` | `false` | Set to `true` to print raw OTel payloads to stdout |
| `OTEL_SDK_DISABLED` | `false` | Set to `true` to disable all OpenTelemetry exporters |
| `LOG_LEVEL` | `INFO` | Structured JSON log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |

See [OBSERVABILITY.md](./OBSERVABILITY.md) for collector recipes and the full metric catalog.

---

## Local Development

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

---

## Running Automated Tests

All tests use Python's built-in `unittest` against isolated temporary SQLite databases (your local `kanban.db` is never modified).

```bash
# Run full suite (REST API, Jinja views, Archive, AC/DoD, OpenAPI, and MCP stdio tests)
.venv/bin/python -W error -m unittest discover -s tests -v
```

---

## Docker

KanbanFlow uses a multi-stage `Dockerfile` based on `python:3.13-slim`:
- Installs dependencies (`Flask`, `gunicorn`) into `/opt/venv`.
- Runs as non-root user `10001:10001` on port `8080`.
- Stores SQLite at `/data/kanban.db` (`VOLUME ["/data"]`).
- Runs Gunicorn with `--workers 1 --threads 4 --worker-tmp-dir /dev/shm` for safe SQLite WAL concurrency and `readOnlyRootFilesystem` compatibility.

```bash
# Build image
docker build -t kanbanflow:latest .

# Run locally with a persistent Docker volume
docker run --rm -p 8080:8080 -v kanbanflow-data:/data kanbanflow:latest
```

---

## Kubernetes Deployment

The ready-to-apply manifest in `k8s/deployment.yaml` defines:
1. **`PersistentVolumeClaim` (`kanbanflow-data`):** `1Gi` `ReadWriteOnce` volume mounted at `/data`.
2. **`Deployment` (`kanbanflow`):**
   - `replicas: 1` with `strategy.type: Recreate` so the SQLite `ReadWriteOnce` PVC detaches cleanly during rollouts.
   - Pod & container security hardening: `runAsNonRoot: true`, `runAsUser: 10001`, `fsGroup: 10001`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`, plus an `emptyDir` mounted at `/tmp`.
   - HTTP `livenessProbe` and `readinessProbe` targeting `/healthz`.
3. **`Service` (`kanbanflow`):** `ClusterIP` exposing port `80` → container port `8080`.

```bash
# 1. Build and push image to your container registry
docker build --platform linux/amd64,linux/arm64 -t <registry>/kanbanflow:1.0.0 --push .

# 2. Update the image reference in k8s/deployment.yaml, then deploy
kubectl apply -f k8s/deployment.yaml

# 3. Verify pod readiness and port-forward to test
kubectl rollout status deployment/kanbanflow
kubectl port-forward svc/kanbanflow 8080:80
```
