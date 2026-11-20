"""OpenTelemetry instrumentation for KanbanFlow: Traces, Metrics, and Logs.

Configures all three OpenTelemetry signals using standard OTEL_* environment
variables:
  - OTEL_SERVICE_NAME (default: "kanbanflow")
  - OTEL_EXPORTER_OTLP_ENDPOINT (e.g., "http://otel-collector:4318")
  - OTEL_CONSOLE_EXPORTER ("true" to also print raw OTel telemetry to stdout)
  - OTEL_SDK_DISABLED ("true" to disable exporters)
  - DEPLOYMENT_ENV (default: "local")
"""

from __future__ import annotations

import atexit
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone
import json
import logging
import os
import sys
import time
from typing import Any

from flask import Flask, g, request
from opentelemetry import context as otel_context
from opentelemetry import metrics, trace
from opentelemetry._logs import SeverityNumber, set_logger_provider
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.sqlite3 import SQLite3Instrumentor
from opentelemetry.metrics import Observation
from opentelemetry.sdk._logs import LoggerProvider
from opentelemetry.sdk._logs.export import (
    BatchLogRecordProcessor,
    ConsoleLogRecordExporter,
    LogRecordExporter,
    SimpleLogRecordProcessor,
)
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import (
    ConsoleMetricExporter,
    MetricReader,
    PeriodicExportingMetricReader,
)
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    ConsoleSpanExporter,
    SimpleSpanProcessor,
    SpanExporter,
)

import database as db

SERVICE_VERSION = "1.0.0"

_SQLITE_INSTRUMENTED = False
_GLOBAL_PROVIDERS_SET = False

_RESERVED_LOG_ATTRS = frozenset(
    {
        "args",
        "asctime",
        "created",
        "exc_info",
        "exc_text",
        "filename",
        "funcName",
        "levelname",
        "levelno",
        "lineno",
        "module",
        "msecs",
        "message",
        "msg",
        "name",
        "pathname",
        "process",
        "processName",
        "relativeCreated",
        "stack_info",
        "taskName",
        "thread",
        "threadName",
    }
)


def _severity_from_levelno(levelno: int) -> SeverityNumber:
    if levelno >= logging.CRITICAL:
        return SeverityNumber.FATAL
    if levelno >= logging.ERROR:
        return SeverityNumber.ERROR
    if levelno >= logging.WARNING:
        return SeverityNumber.WARN
    if levelno >= logging.INFO:
        return SeverityNumber.INFO
    return SeverityNumber.DEBUG


class OTelLoggingHandler(logging.Handler):
    """Bridges Python stdlib logging into an OpenTelemetry LoggerProvider."""

    def __init__(self, logger_provider: LoggerProvider, level: int = logging.INFO) -> None:
        super().__init__(level=level)
        self._logger_provider = logger_provider

    def emit(self, record: logging.LogRecord) -> None:
        try:
            otel_logger = self._logger_provider.get_logger(record.name, SERVICE_VERSION)
            attributes: dict[str, Any] = {
                "code.filepath": record.pathname,
                "code.function": record.funcName,
                "code.lineno": record.lineno,
            }
            for key, value in record.__dict__.items():
                if key not in _RESERVED_LOG_ATTRS and not key.startswith("_"):
                    if isinstance(value, (bool, int, float, str)):
                        attributes[key] = value
                    elif value is not None:
                        attributes[key] = str(value)

            otel_logger.emit(
                timestamp=int(record.created * 1_000_000_000),
                context=otel_context.get_current(),
                severity_number=_severity_from_levelno(record.levelno),
                severity_text=record.levelname,
                body=record.getMessage(),
                attributes=attributes,
            )
        except Exception:  # pragma: no cover
            self.handleError(record)


class TraceCorrelatedJsonFormatter(logging.Formatter):
    """Formats Python log records as JSON with active OpenTelemetry trace_id & span_id."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        span = trace.get_current_span()
        ctx = span.get_span_context() if span else None
        if ctx and ctx.is_valid:
            payload["trace_id"] = f"{ctx.trace_id:032x}"
            payload["span_id"] = f"{ctx.span_id:016x}"

        for key, value in record.__dict__.items():
            if key not in _RESERVED_LOG_ATTRS and not key.startswith("_"):
                payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


@dataclass
class TelemetryContext:
    """Holds OpenTelemetry providers, instruments, and structured logger for an app instance."""

    tracer_provider: TracerProvider
    meter_provider: MeterProvider
    logger_provider: LoggerProvider
    tracer: trace.Tracer
    meter: metrics.Meter
    logger: logging.Logger
    http_request_duration: metrics.Histogram
    http_requests_total: metrics.Counter
    tasks_created: metrics.Counter
    tasks_moved: metrics.Counter
    tasks_deleted: metrics.Counter
    tasks_archived: metrics.Counter
    tasks_restored: metrics.Counter
    _otel_log_handler: logging.Handler
    _shut_down: bool = False

    def shutdown(self) -> None:
        """Flush and detach providers cleanly (idempotent)."""
        if self._shut_down:
            return
        self._shut_down = True
        self.logger.removeHandler(self._otel_log_handler)
        self.tracer_provider.shutdown()
        self.meter_provider.shutdown()
        self.logger_provider.shutdown()


def _is_truthy(val: str | None) -> bool:
    return (val or "").strip().lower() in {"1", "true", "yes", "on"}


def _build_resource() -> Resource:
    service_name = os.environ.get("OTEL_SERVICE_NAME", "kanbanflow")
    environment = os.environ.get("DEPLOYMENT_ENV", "local")
    return Resource.create(
        {
            "service.name": service_name,
            "service.version": SERVICE_VERSION,
            "deployment.environment.name": environment,
        }
    )


def _instrument_sqlite_once() -> None:
    global _SQLITE_INSTRUMENTED
    if not _SQLITE_INSTRUMENTED:
        SQLite3Instrumentor().instrument()
        _SQLITE_INSTRUMENTED = True


def setup_telemetry(
    app: Flask,
    db_path_getter: Callable[[], str | None],
    *,
    span_exporter: SpanExporter | None = None,
    metric_reader: MetricReader | None = None,
    log_exporter: LogRecordExporter | None = None,
    set_global_providers: bool = True,
    enable_stderr_json_logs: bool | None = None,
) -> TelemetryContext:
    """Configure OpenTelemetry Traces, Metrics, and Logs for a Flask Kanban app."""
    sdk_disabled = _is_truthy(os.environ.get("OTEL_SDK_DISABLED"))
    otlp_endpoint = (os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT") or "").strip().rstrip("/")
    console_export = _is_truthy(os.environ.get("OTEL_CONSOLE_EXPORTER"))
    resource = _build_resource()

    # ------------------------------------------------------------------
    # 1. Traces
    # ------------------------------------------------------------------
    tracer_provider = TracerProvider(resource=resource)
    if span_exporter is not None:
        tracer_provider.add_span_processor(SimpleSpanProcessor(span_exporter))
    elif not sdk_disabled:
        if otlp_endpoint:
            tracer_provider.add_span_processor(
                BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{otlp_endpoint}/v1/traces"))
            )
        if console_export:
            tracer_provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))

    global _GLOBAL_PROVIDERS_SET
    should_set_global = set_global_providers and not _GLOBAL_PROVIDERS_SET

    if should_set_global:
        trace.set_tracer_provider(tracer_provider)

    # ------------------------------------------------------------------
    # 2. Metrics
    # ------------------------------------------------------------------
    metric_readers: list[MetricReader] = []
    if metric_reader is not None:
        metric_readers.append(metric_reader)
    elif not sdk_disabled:
        export_interval_ms = int(os.environ.get("OTEL_METRIC_EXPORT_INTERVAL", "30000"))
        if otlp_endpoint:
            metric_readers.append(
                PeriodicExportingMetricReader(
                    OTLPMetricExporter(endpoint=f"{otlp_endpoint}/v1/metrics"),
                    export_interval_millis=export_interval_ms,
                )
            )
        if console_export:
            metric_readers.append(
                PeriodicExportingMetricReader(
                    ConsoleMetricExporter(),
                    export_interval_millis=export_interval_ms,
                )
            )

    meter_provider = MeterProvider(resource=resource, metric_readers=metric_readers)
    if should_set_global:
        metrics.set_meter_provider(meter_provider)

    # ------------------------------------------------------------------
    # 3. Logs
    # ------------------------------------------------------------------
    logger_provider = LoggerProvider(resource=resource)
    if log_exporter is not None:
        logger_provider.add_log_record_processor(SimpleLogRecordProcessor(log_exporter))
    elif not sdk_disabled:
        if otlp_endpoint:
            logger_provider.add_log_record_processor(
                BatchLogRecordProcessor(OTLPLogExporter(endpoint=f"{otlp_endpoint}/v1/logs"))
            )
        if console_export:
            logger_provider.add_log_record_processor(
                SimpleLogRecordProcessor(ConsoleLogRecordExporter())
            )

    if should_set_global:
        set_logger_provider(logger_provider)
        _GLOBAL_PROVIDERS_SET = True

    logger_name = f"kanbanflow.{id(app)}" if not should_set_global else "kanbanflow"
    app_logger = logging.getLogger(logger_name)
    app_logger.setLevel(os.environ.get("LOG_LEVEL", "INFO").upper())
    app_logger.propagate = False

    # Attach OTelLoggingHandler so Python logs emit OTel LogRecords with trace context
    otel_handler = OTelLoggingHandler(logger_provider=logger_provider, level=logging.INFO)
    app_logger.addHandler(otel_handler)

    # Structured JSON stderr handler (disabled automatically during unittest unless opted in)
    if enable_stderr_json_logs is None:
        enable_stderr_json_logs = not app.config.get("TESTING", False) and not (
            "unittest" in sys.modules
        )
    if enable_stderr_json_logs and not any(
        isinstance(h, logging.StreamHandler) for h in app_logger.handlers
    ):
        stream_handler = logging.StreamHandler(sys.stderr)
        stream_handler.setFormatter(TraceCorrelatedJsonFormatter())
        app_logger.addHandler(stream_handler)

    # ------------------------------------------------------------------
    # 4. Auto-instrumentation (Flask HTTP + SQLite3)
    # ------------------------------------------------------------------
    FlaskInstrumentor().instrument_app(
        app,
        tracer_provider=tracer_provider,
        meter_provider=meter_provider,
        excluded_urls=r"/healthz,/static/.*",
    )
    _instrument_sqlite_once()

    # ------------------------------------------------------------------
    # 5. Domain & HTTP Instruments
    # ------------------------------------------------------------------
    tracer = tracer_provider.get_tracer("kanbanflow", SERVICE_VERSION)
    meter = meter_provider.get_meter("kanbanflow", SERVICE_VERSION)

    http_request_duration = meter.create_histogram(
        name="http.server.request.duration",
        unit="ms",
        description="HTTP request processing duration in milliseconds.",
    )
    http_requests_total = meter.create_counter(
        name="http.server.requests",
        unit="1",
        description="Total HTTP requests served by KanbanFlow.",
    )
    tasks_created = meter.create_counter(
        name="kanban.tasks.created",
        unit="1",
        description="Total Kanban cards created.",
    )
    tasks_moved = meter.create_counter(
        name="kanban.tasks.moved",
        unit="1",
        description="Total Kanban card move operations.",
    )
    tasks_deleted = meter.create_counter(
        name="kanban.tasks.deleted",
        unit="1",
        description="Total Kanban cards deleted.",
    )
    tasks_archived = meter.create_counter(
        name="kanban.tasks.archived",
        unit="1",
        description="Total Kanban cards archived from Done.",
    )
    tasks_restored = meter.create_counter(
        name="kanban.tasks.restored",
        unit="1",
        description="Total archived Kanban cards restored to the board.",
    )

    def _observe_active_tasks(_options: Any) -> list[Observation]:
        observations: list[Observation] = []
        try:
            columns = db.get_board(db_path=db_path_getter())
            for col in columns:
                counts: dict[str, int] = {}
                for task in col["tasks"]:
                    ct = task.get("card_type", "task")
                    counts[ct] = counts.get(ct, 0) + 1
                for ct, count in counts.items():
                    observations.append(
                        Observation(count, {"column": col["slug"], "card_type": ct})
                    )
        except Exception:
            pass
        return observations

    def _observe_archived_tasks(_options: Any) -> list[Observation]:
        try:
            return [Observation(db.count_archived_tasks(db_path=db_path_getter()))]
        except Exception:
            return []

    meter.create_observable_gauge(
        name="kanban.tasks.active",
        callbacks=[_observe_active_tasks],
        unit="1",
        description="Current active Kanban tasks by column and card type.",
    )
    meter.create_observable_gauge(
        name="kanban.tasks.archived.total",
        callbacks=[_observe_archived_tasks],
        unit="1",
        description="Current total number of archived Kanban tasks.",
    )

    # ------------------------------------------------------------------
    # 6. Flask Request Lifecycle Hooks (Metrics, Trace Header, Logs)
    # ------------------------------------------------------------------
    @app.before_request
    def _otel_before_request() -> None:
        g._otel_start_time = time.perf_counter()

    @app.after_request
    def _otel_after_request(response):
        start = getattr(g, "_otel_start_time", None)
        route = request.url_rule.rule if request.url_rule else request.path

        if start is not None and not route.startswith("/static"):
            duration_ms = round((time.perf_counter() - start) * 1000.0, 2)
            attrs = {
                "http.request.method": request.method,
                "http.route": route,
                "http.response.status_code": response.status_code,
            }
            http_request_duration.record(duration_ms, attrs)
            http_requests_total.add(1, attrs)

            if route != "/healthz":
                app_logger.info(
                    "HTTP %s %s -> %s (%.2fms)",
                    request.method,
                    route,
                    response.status_code,
                    duration_ms,
                    extra={
                        "http.method": request.method,
                        "http.route": route,
                        "http.status_code": response.status_code,
                        "http.duration_ms": duration_ms,
                    },
                )

        span = trace.get_current_span()
        ctx = span.get_span_context() if span else None
        if ctx and ctx.is_valid:
            response.headers["X-Trace-Id"] = f"{ctx.trace_id:032x}"

        return response

    context = TelemetryContext(
        tracer_provider=tracer_provider,
        meter_provider=meter_provider,
        logger_provider=logger_provider,
        tracer=tracer,
        meter=meter,
        logger=app_logger,
        http_request_duration=http_request_duration,
        http_requests_total=http_requests_total,
        tasks_created=tasks_created,
        tasks_moved=tasks_moved,
        tasks_deleted=tasks_deleted,
        tasks_archived=tasks_archived,
        tasks_restored=tasks_restored,
        _otel_log_handler=otel_handler,
    )

    return context
