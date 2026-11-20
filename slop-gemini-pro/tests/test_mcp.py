"""End-to-end stdio tests for the KanbanFlow MCP server and example client."""

from __future__ import annotations

from pathlib import Path
import tempfile
import unittest

from mcp_server.example_client import KanbanMCPClient, MCPClientError


class KanbanMCPServerTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self._tmpdir.name) / "mcp_test.db"

    def tearDown(self) -> None:
        self._tmpdir.cleanup()

    def test_mcp_handshake_tools_and_resources(self) -> None:
        with KanbanMCPClient(db_path=self.db_path, seed_sample_tasks=False) as client:
            self.assertEqual(client.server_info["name"], "kanbanflow-mcp")
            self.assertEqual(client.ping(), {})

            tool_names = {t["name"] for t in client.list_tools()}
            self.assertTrue(
                {
                    "get_board",
                    "list_columns",
                    "list_tasks",
                    "get_task",
                    "create_task",
                    "update_task",
                    "move_task",
                    "delete_task",
                    "list_archived_tasks",
                    "archive_task",
                    "archive_done_tasks",
                    "restore_task",
                }.issubset(tool_names)
            )

            resource_uris = {r["uri"] for r in client.list_resources()}
            self.assertEqual(
                resource_uris, {"kanban://board", "kanban://columns", "kanban://archive"}
            )

            cols = client.read_resource("kanban://columns")["columns"]
            self.assertEqual([c["slug"] for c in cols], ["backlog", "in_progress", "review", "done"])

    def test_mcp_full_task_and_archive_lifecycle(self) -> None:
        with KanbanMCPClient(db_path=self.db_path, seed_sample_tasks=False) as client:
            # Create blocker & blocked cards with AC/DoD
            blocker = client.call_tool(
                "create_task",
                {
                    "title": "Fix CI pipeline",
                    "column_slug": "in_progress",
                    "priority": "urgent",
                    "card_type": "blocker",
                    "acceptance_criteria": "Build green on main",
                    "definition_of_done": "Pipeline verified",
                },
            )
            blocked = client.call_tool(
                "create_task",
                {
                    "title": "Cut release tag",
                    "column_slug": "backlog",
                    "priority": "high",
                    "card_type": "blocked",
                    "blocker_ids": [blocker["id"]],
                },
            )
            self.assertEqual(blocked["blocker_ids"], [blocker["id"]])

            # Verify reverse link via get_task
            refetched_blocker = client.call_tool("get_task", {"task_id": blocker["id"]})
            self.assertEqual(refetched_blocker["blocking_ids"], [blocked["id"]])

            # Archiving a non-Done task returns MCP tool error
            with self.assertRaises(MCPClientError):
                client.call_tool("archive_task", {"task_id": blocker["id"]})

            # Move blocker to Done, update DoD, and archive it
            client.call_tool(
                "update_task",
                {"task_id": blocker["id"], "definition_of_done": "[x] Pipeline verified"},
            )
            moved = client.call_tool(
                "move_task", {"task_id": blocker["id"], "column_slug": "done"}
            )
            self.assertEqual(moved["id"], blocker["id"])

            archived = client.call_tool("archive_task", {"task_id": blocker["id"]})
            self.assertIsNotNone(archived["archived_at"])

            # Verify archive list & resource
            archived_list = client.call_tool("list_archived_tasks", {"query": "CI pipeline"})
            self.assertEqual(archived_list["count"], 1)
            self.assertEqual(client.read_resource("kanban://archive")["count"], 1)

            # Restore and delete
            restored = client.call_tool("restore_task", {"task_id": blocker["id"]})
            self.assertIsNone(restored["archived_at"])

            deleted = client.call_tool("delete_task", {"task_id": blocked["id"]})
            self.assertTrue(deleted["deleted"])


if __name__ == "__main__":
    unittest.main()
