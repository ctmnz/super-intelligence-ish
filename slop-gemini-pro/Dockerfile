# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: Build Python dependencies into an isolated virtual environment
# ---------------------------------------------------------------------------
FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# Stage 2: Minimal non-root runtime image for Kubernetes
# ---------------------------------------------------------------------------
FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8080 \
    KANBAN_DB_PATH=/data/kanban.db

# Create non-root numeric UID/GID for Kubernetes runAsNonRoot compliance
RUN groupadd --gid 10001 appgroup \
    && useradd --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin appuser \
    && mkdir -p /app /data \
    && chown -R 10001:10001 /app /data

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --chown=10001:10001 app.py database.py openapi_spec.py telemetry.py schema.sql ./
COPY --chown=10001:10001 templates ./templates
COPY --chown=10001:10001 static ./static

VOLUME ["/data"]

USER 10001:10001

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/healthz', timeout=2)" || exit 1

# Single worker + threads keeps SQLite locking clean while serving concurrent requests
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "4", "--worker-tmp-dir", "/dev/shm", "--timeout", "30", "--graceful-timeout", "15", "--access-logfile", "-", "app:app"]
