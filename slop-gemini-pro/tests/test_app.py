"""End-to-end API and Jinja template tests for KanbanFlow."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from app import create_app


class KanbanAppTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self.db_path = str(Path(self._tmpdir.name) / "test_kanban.db")
        self.app = create_app(
            db_path=self.db_path,
            seed_sample_tasks=False,
            telemetry_kwargs={"set_global_providers": False, "enable_stderr_json_logs": False},
        )
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        self.app.extensions["telemetry"].shutdown()
        self._tmpdir.cleanup()

    def test_index_renders_default_columns(self) -> None:
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        html = resp.get_data(as_text=True)
        for col_name in ("Backlog", "In Progress", "Review", "Done"):
            self.assertIn(col_name, html)

    def test_healthz_endpoint(self) -> None:
        resp = self.client.get("/healthz")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json(), {"status": "ok"})

    def test_openapi_spec_and_swagger_ui(self) -> None:
        spec_resp = self.client.get("/openapi.json")
        self.assertEqual(spec_resp.status_code, 200)
        spec = spec_resp.get_json()
        self.assertEqual(spec["openapi"], "3.1.0")
        expected_paths = {
            "/healthz",
            "/api/board",
            "/api/columns",
            "/api/columns/{column_id}",
            "/api/tasks",
            "/api/tasks/{task_id}",
            "/api/tasks/{task_id}/move",
            "/api/archive",
            "/api/tasks/{task_id}/archive",
            "/api/archive/done",
            "/api/tasks/{task_id}/restore",
        }
        self.assertTrue(expected_paths.issubset(set(spec["paths"].keys())))
        self.assertIn("Task", spec["components"]["schemas"])
        self.assertIn("acceptance_criteria", spec["components"]["schemas"]["Task"]["properties"])
        self.assertIn("definition_of_done", spec["components"]["schemas"]["Task"]["properties"])

        for route in ("/docs", "/swagger"):
            ui_resp = self.client.get(route)
            self.assertEqual(ui_resp.status_code, 200)
            html = ui_resp.get_data(as_text=True)
            self.assertIn("SwaggerUIBundle", html)
            self.assertIn("/openapi.json", html)

    def test_task_crud_and_move(self) -> None:
        cols = self.client.get("/api/columns").get_json()["columns"]
        self.assertEqual([c["slug"] for c in cols], ["backlog", "in_progress", "review", "done"])
        backlog_id, in_progress_id = cols[0]["id"], cols[1]["id"]

        # Create
        created = self.client.post(
            "/api/tasks",
            json={
                "title": "Write API tests",
                "description": "Cover CRUD, move, and search",
                "priority": "high",
                "column_id": backlog_id,
                "due_date": "2026-12-01",
            },
        )
        self.assertEqual(created.status_code, 201)
        task = created.get_json()
        task_id = task["id"]
        self.assertEqual(task["priority"], "high")
        self.assertEqual(task["column_id"], backlog_id)

        # Update
        updated = self.client.put(
            f"/api/tasks/{task_id}",
            json={"title": "Write comprehensive API tests", "priority": "urgent"},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["priority"], "urgent")

        # Move to In Progress
        moved = self.client.patch(
            f"/api/tasks/{task_id}/move",
            json={"column_id": in_progress_id, "position": 0},
        )
        self.assertEqual(moved.status_code, 200)
        self.assertEqual(moved.get_json()["column_id"], in_progress_id)

        # Filter by priority & keyword
        filtered = self.client.get("/api/tasks?priority=urgent&q=comprehensive").get_json()["tasks"]
        self.assertEqual(len(filtered), 1)
        self.assertEqual(filtered[0]["id"], task_id)

        # Delete
        deleted = self.client.delete(f"/api/tasks/{task_id}")
        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(self.client.get(f"/api/tasks/{task_id}").status_code, 404)

    def test_column_crud(self) -> None:
        created = self.client.post("/api/columns", json={"name": "Blocked", "color": "#ef4444"})
        self.assertEqual(created.status_code, 201)
        col_id = created.get_json()["id"]

        updated = self.client.put(f"/api/columns/{col_id}", json={"name": "On Hold"})
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["name"], "On Hold")

        deleted = self.client.delete(f"/api/columns/{col_id}")
        self.assertEqual(deleted.status_code, 200)

    def test_blocked_and_blocker_card_types(self) -> None:
        cols = self.client.get("/api/columns").get_json()["columns"]
        col_id = cols[0]["id"]

        blocked_resp = self.client.post(
            "/api/tasks",
            json={"title": "Waiting on vendor", "column_id": col_id, "card_type": "blocked"},
        )
        self.assertEqual(blocked_resp.status_code, 201)
        blocked_task = blocked_resp.get_json()
        self.assertEqual(blocked_task["card_type"], "blocked")

        blocker_resp = self.client.post(
            "/api/tasks",
            json={"title": "Prod DB deadlock", "column_id": col_id, "card_type": "blocker"},
        )
        self.assertEqual(blocker_resp.status_code, 201)
        blocker_task = blocker_resp.get_json()
        self.assertEqual(blocker_task["card_type"], "blocker")

        # Invalid card_type rejected
        invalid_resp = self.client.post(
            "/api/tasks",
            json={"title": "Invalid", "column_id": col_id, "card_type": "epic"},
        )
        self.assertEqual(invalid_resp.status_code, 400)

        # Filtering by card_type
        only_blocked = self.client.get("/api/tasks?card_type=blocked").get_json()["tasks"]
        self.assertEqual([t["id"] for t in only_blocked], [blocked_task["id"]])

        board_blockers = self.client.get("/api/board?card_type=blocker").get_json()["columns"]
        total_board_blockers = sum(len(c["tasks"]) for c in board_blockers)
        self.assertEqual(total_board_blockers, 1)

        # Updating card_type
        patched = self.client.patch(
            f"/api/tasks/{blocked_task['id']}",
            json={"card_type": "task"},
        )
        self.assertEqual(patched.status_code, 200)
        self.assertEqual(patched.get_json()["card_type"], "task")

    def test_blocker_and_blocked_relationships(self) -> None:
        cols = self.client.get("/api/columns").get_json()["columns"]
        backlog_id, in_progress_id = cols[0]["id"], cols[1]["id"]

        # Create a blocker card and a plain card
        blocker_a = self.client.post(
            "/api/tasks",
            json={"title": "Blocker A", "column_id": in_progress_id, "card_type": "blocker"},
        ).get_json()
        plain_b = self.client.post(
            "/api/tasks",
            json={"title": "Blocker B (promoted)", "column_id": in_progress_id, "card_type": "task"},
        ).get_json()

        # Create a blocked card linked to both
        blocked = self.client.post(
            "/api/tasks",
            json={
                "title": "Blocked Release",
                "column_id": backlog_id,
                "card_type": "blocked",
                "blocker_ids": [blocker_a["id"], plain_b["id"]],
            },
        ).get_json()

        self.assertEqual(sorted(blocked["blocker_ids"]), sorted([blocker_a["id"], plain_b["id"]]))

        # Verify reverse lookup on blocker cards and auto-promotion of plain_b to blocker
        fetched_a = self.client.get(f"/api/tasks/{blocker_a['id']}").get_json()
        fetched_b = self.client.get(f"/api/tasks/{plain_b['id']}").get_json()
        self.assertEqual(fetched_a["blocking_ids"], [blocked["id"]])
        self.assertEqual(fetched_b["card_type"], "blocker")
        self.assertEqual(fetched_b["blocking_ids"], [blocked["id"]])

        # Self-blocking rejected
        self_block = self.client.put(
            f"/api/tasks/{blocked['id']}",
            json={"card_type": "blocked", "blocker_ids": [blocked["id"]]},
        )
        self.assertEqual(self_block.status_code, 400)

        # Deleting a blocker cascades cleanly out of blocked card's blocker_ids
        self.client.delete(f"/api/tasks/{blocker_a['id']}")
        refetched_blocked = self.client.get(f"/api/tasks/{blocked['id']}").get_json()
        self.assertEqual(refetched_blocked["blocker_ids"], [plain_b["id"]])

        # Reverting blocked card back to standard clears dependencies
        reverted = self.client.patch(
            f"/api/tasks/{blocked['id']}",
            json={"card_type": "task"},
        ).get_json()
        self.assertEqual(reverted["blocker_ids"], [])
        self.assertEqual(
            self.client.get(f"/api/tasks/{plain_b['id']}").get_json()["blocking_ids"], []
        )

    def test_legacy_db_migrates_card_type_column(self) -> None:
        import sqlite3
        import database as db

        legacy_path = str(Path(self._tmpdir.name) / "legacy.db")
        conn = sqlite3.connect(legacy_path)
        conn.executescript(
            """
            CREATE TABLE columns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                position INTEGER NOT NULL,
                color TEXT NOT NULL DEFAULT '#64748b',
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            );
            CREATE TABLE tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                column_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                priority TEXT NOT NULL DEFAULT 'medium',
                position INTEGER NOT NULL DEFAULT 0,
                due_date TEXT,
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            );
            INSERT INTO columns (slug, name, position) VALUES ('backlog', 'Backlog', 0);
            INSERT INTO tasks (column_id, title) VALUES (1, 'Legacy card');
            """
        )
        conn.commit()
        conn.close()

        db.init_db(db_path=legacy_path)
        tasks = db.list_tasks(db_path=legacy_path)
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0]["card_type"], "task")
        self.assertIsNone(tasks[0]["archived_at"])
        self.assertEqual(tasks[0]["acceptance_criteria"], "")
        self.assertEqual(tasks[0]["definition_of_done"], "")

    def test_acceptance_criteria_and_definition_of_done(self) -> None:
        cols = self.client.get("/api/columns").get_json()["columns"]
        col_id = cols[0]["id"]

        created = self.client.post(
            "/api/tasks",
            json={
                "title": "Add OAuth login",
                "column_id": col_id,
                "acceptance_criteria": "Users can sign in\nInvalid tokens return 401",
                "definition_of_done": "Unit tests pass\nSecurity review approved",
            },
        )
        self.assertEqual(created.status_code, 201)
        task = created.get_json()
        self.assertIn("Invalid tokens return 401", task["acceptance_criteria"])
        self.assertIn("Security review approved", task["definition_of_done"])

        # Search matches acceptance criteria & definition of done
        by_ac = self.client.get("/api/tasks?q=Invalid tokens").get_json()["tasks"]
        self.assertEqual([t["id"] for t in by_ac], [task["id"]])

        by_dod = self.client.get("/api/tasks?q=Security review").get_json()["tasks"]
        self.assertEqual([t["id"] for t in by_dod], [task["id"]])

        # Update fields
        updated = self.client.patch(
            f"/api/tasks/{task['id']}",
            json={"definition_of_done": "Unit tests pass\nDeployed to staging"},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(
            updated.get_json()["definition_of_done"], "Unit tests pass\nDeployed to staging"
        )

    def test_archive_done_tasks_and_restore(self) -> None:
        cols = self.client.get("/api/columns").get_json()["columns"]
        backlog_id = cols[0]["id"]
        done_id = next(c["id"] for c in cols if c["slug"] == "done")

        backlog_task = self.client.post(
            "/api/tasks", json={"title": "Not finished yet", "column_id": backlog_id}
        ).get_json()
        done_task_1 = self.client.post(
            "/api/tasks", json={"title": "Shipped feature A", "column_id": done_id}
        ).get_json()
        done_task_2 = self.client.post(
            "/api/tasks", json={"title": "Shipped feature B", "column_id": done_id}
        ).get_json()

        # Archiving a non-Done task is rejected
        bad = self.client.post(f"/api/tasks/{backlog_task['id']}/archive")
        self.assertEqual(bad.status_code, 400)

        # Archive a single Done task
        ok = self.client.post(f"/api/tasks/{done_task_1['id']}/archive")
        self.assertEqual(ok.status_code, 200)
        self.assertIsNotNone(ok.get_json()["archived_at"])

        # Verify archived card is excluded from active board and listed in /api/archive
        board = self.client.get("/api/board").get_json()
        self.assertEqual(board["archived_count"], 1)
        active_ids = [t["id"] for c in board["columns"] for t in c["tasks"]]
        self.assertNotIn(done_task_1["id"], active_ids)

        archive_res = self.client.get("/api/archive?q=feature A").get_json()
        self.assertEqual(archive_res["count"], 1)
        self.assertEqual(archive_res["tasks"][0]["id"], done_task_1["id"])

        # Bulk archive remaining Done cards
        bulk = self.client.post("/api/archive/done").get_json()
        self.assertEqual(bulk["archived_count"], 1)
        self.assertEqual(self.client.get("/api/archive").get_json()["count"], 2)

        # Restore back to Done
        restored = self.client.post(f"/api/tasks/{done_task_1['id']}/restore")
        self.assertEqual(restored.status_code, 200)
        self.assertIsNone(restored.get_json()["archived_at"])
        self.assertEqual(restored.get_json()["column_id"], done_id)
        self.assertEqual(self.client.get("/api/archive").get_json()["count"], 1)


if __name__ == "__main__":
    unittest.main()
