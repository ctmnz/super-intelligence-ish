"""End-to-end tests verifying OpenTelemetry Traces, Metrics, and Logs."""

from __future__ import annotations

from pathlib import Path
import tempfile
import unittest

from opentelemetry.sdk._logs.export import InMemoryLogRecordExporter
from opentelemetry.sdk.metrics.export import InMemoryMetricReader
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from app import create_app


class OpenTelemetryTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self.db_path = str(Path(self._tmpdir.name) / "otel_test.db")
        self.span_exporter = InMemorySpanExporter()
        self.metric_reader = InMemoryMetricReader()
        self.log_exporter = InMemoryLogRecordExporter()

        self.app = create_app(
            db_path=self.db_path,
            seed_sample_tasks=False,
            telemetry_kwargs={
                "span_exporter": self.span_exporter,
                "metric_reader": self.metric_reader,
                "log_exporter": self.log_exporter,
                "set_global_providers": False,
                "enable_stderr_json_logs": False,
            },
        )
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        self.app.extensions["telemetry"].shutdown()
        self._tmpdir.cleanup()

    def test_traces_metrics_and_logs_captured_for_task_lifecycle(self) -> None:
        cols = self.client.get("/api/columns").get_json()["columns"]
        backlog_id = cols[0]["id"]
        done_id = next(c["id"] for c in cols if c["slug"] == "done")

        # 1. Create a task
        create_resp = self.client.post(
            "/api/tasks",
            json={
                "title": "Instrument with OpenTelemetry",
                "column_id": backlog_id,
                "priority": "high",
                "card_type": "blocker",
            },
        )
        self.assertEqual(create_resp.status_code, 201)
        trace_header = create_resp.headers.get("X-Trace-Id")
        self.assertIsNotNone(trace_header)
        self.assertEqual(len(trace_header), 32)
        task_id = create_resp.get_json()["id"]

        # 2. Move to Done, archive, then restore
        self.assertEqual(
            self.client.patch(
                f"/api/tasks/{task_id}/move", json={"column_id": done_id, "position": 0}
            ).status_code,
            200,
        )
        self.assertEqual(self.client.post(f"/api/tasks/{task_id}/archive").status_code, 200)
        self.assertEqual(self.client.post(f"/api/tasks/{task_id}/restore").status_code, 200)

        # ---- Assert Traces ----
        spans = self.span_exporter.get_finished_spans()
        span_names = {s.name for s in spans}
        self.assertTrue(
            {
                "kanban.task.create",
                "kanban.task.move",
                "kanban.task.archive",
                "kanban.task.restore",
            }.issubset(span_names)
        )

        create_span = next(s for s in spans if s.name == "kanban.task.create")
        self.assertEqual(create_span.attributes["kanban.task.id"], task_id)
        self.assertEqual(create_span.attributes["kanban.task.priority"], "high")
        self.assertEqual(create_span.attributes["kanban.task.card_type"], "blocker")
        self.assertEqual(f"{create_span.context.trace_id:032x}", trace_header)

        # ---- Assert Metrics ----
        metrics_data = self.metric_reader.get_metrics_data()
        metric_names: dict[str, list] = {}
        for rm in metrics_data.resource_metrics:
            for sm in rm.scope_metrics:
                for m in sm.metrics:
                    metric_names[m.name] = list(m.data.data_points)

        for expected_metric in (
            "http.server.request.duration",
            "http.server.requests",
            "kanban.tasks.created",
            "kanban.tasks.moved",
            "kanban.tasks.archived",
            "kanban.tasks.restored",
            "kanban.tasks.active",
            "kanban.tasks.archived.total",
        ):
            self.assertIn(expected_metric, metric_names)

        self.assertEqual(sum(dp.value for dp in metric_names["kanban.tasks.created"]), 1)
        self.assertEqual(sum(dp.value for dp in metric_names["kanban.tasks.moved"]), 1)
        self.assertEqual(sum(dp.value for dp in metric_names["kanban.tasks.archived"]), 1)
        self.assertEqual(sum(dp.value for dp in metric_names["kanban.tasks.restored"]), 1)
        self.assertEqual(sum(dp.value for dp in metric_names["kanban.tasks.active"]), 1)
        self.assertEqual(sum(dp.value for dp in metric_names["kanban.tasks.archived.total"]), 0)

        # ---- Assert Logs (OTel LogRecords correlated with trace_id) ----
        logs = self.log_exporter.get_finished_logs()
        self.assertGreaterEqual(len(logs), 4)
        created_log = next(
            entry for entry in logs if "Created task" in str(entry.log_record.body)
        )
        self.assertEqual(
            f"{created_log.log_record.trace_id:032x}",
            trace_header,
        )


if __name__ == "__main__":
    unittest.main()
