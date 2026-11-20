"""Example MCP stdio client for KanbanFlow task operations.

Demonstrates connecting to `mcp_server/server.py` over stdio, performing the
MCP handshake, inspecting tools/resources, and running a complete task
lifecycle (create blocker + blocked cards, update AC/DoD, move to Done,
archive, restore, and delete).

Usage:
    # Safe demo against a temporary SQLite DB (does not touch kanban.db):
    python mcp_server/example_client.py

    # Run against your live workspace kanban.db:
    python mcp_server/example_client.py --live
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from typing import Any

SERVER_SCRIPT = Path(__file__).resolve().parent / "server.py"


class MCPClientError(RuntimeError):
    """Raised when the MCP server returns a JSON-RPC or tool error."""


class KanbanMCPClient:
    """Minimal MCP stdio client communicating with `mcp_server/server.py`."""

    def __init__(
        self,
        *,
        db_path: str | Path | None = None,
        seed_sample_tasks: bool = True,
        python_executable: str | None = None,
    ) -> None:
        self.db_path = str(db_path) if db_path is not None else None
        self.seed_sample_tasks = seed_sample_tasks
        self.python_executable = python_executable or sys.executable
        self._proc: subprocess.Popen[str] | None = None
        self._next_id = 1
        self.server_info: dict[str, Any] = {}

    def __enter__(self) -> "KanbanMCPClient":
        self.connect()
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()

    def connect(self) -> dict[str, Any]:
        """Spawn the MCP server subprocess and perform the MCP initialize handshake."""
        env = os.environ.copy()
        if self.db_path is not None:
            env["KANBAN_DB_PATH"] = self.db_path
        env["KANBAN_SEED_SAMPLE_TASKS"] = "1" if self.seed_sample_tasks else "0"

        self._proc = subprocess.Popen(
            [self.python_executable, str(SERVER_SCRIPT)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            env=env,
        )

        init_result = self._request(
            "initialize",
            {
                "protocolVersion": "2025-03-26",
                "capabilities": {},
                "clientInfo": {"name": "kanbanflow-example-client", "version": "1.0.0"},
            },
        )
        self.server_info = init_result.get("serverInfo", {})
        self._notify("notifications/initialized", {})
        return init_result

    def close(self) -> None:
        """Close stdin and terminate the MCP server process cleanly."""
        if self._proc is None:
            return
        if self._proc.stdin and not self._proc.stdin.closed:
            self._proc.stdin.close()
        try:
            self._proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            self._proc.terminate()
            self._proc.wait(timeout=2)
        if self._proc.stdout and not self._proc.stdout.closed:
            self._proc.stdout.close()
        if self._proc.stderr and not self._proc.stderr.closed:
            self._proc.stderr.close()
        self._proc = None

    def _send(self, payload: dict[str, Any]) -> None:
        if not self._proc or not self._proc.stdin:
            raise MCPClientError("MCP client is not connected.")
        self._proc.stdin.write(json.dumps(payload) + "\n")
        self._proc.stdin.flush()

    def _notify(self, method: str, params: dict[str, Any] | None = None) -> None:
        self._send({"jsonrpc": "2.0", "method": method, "params": params or {}})

    def _request(self, method: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        req_id = self._next_id
        self._next_id += 1
        self._send({"jsonrpc": "2.0", "id": req_id, "method": method, "params": params or {}})

        assert self._proc and self._proc.stdout
        line = self._proc.stdout.readline()
        if not line:
            stderr_output = self._proc.stderr.read() if self._proc.stderr else ""
            raise MCPClientError(f"MCP server closed unexpectedly. stderr: {stderr_output.strip()}")

        response = json.loads(line)
        if "error" in response:
            err = response["error"]
            raise MCPClientError(f"JSON-RPC error {err.get('code')}: {err.get('message')}")
        return response["result"]

    def ping(self) -> dict[str, Any]:
        return self._request("ping")

    def list_tools(self) -> list[dict[str, Any]]:
        return self._request("tools/list")["tools"]

    def call_tool(self, name: str, arguments: dict[str, Any] | None = None) -> dict[str, Any]:
        """Call an MCP tool and return the decoded JSON payload."""
        result = self._request("tools/call", {"name": name, "arguments": arguments or {}})
        text = result["content"][0]["text"]
        payload = json.loads(text)
        if result.get("isError"):
            raise MCPClientError(payload.get("error", text))
        return payload

    def list_resources(self) -> list[dict[str, Any]]:
        return self._request("resources/list")["resources"]

    def read_resource(self, uri: str) -> dict[str, Any]:
        result = self._request("resources/read", {"uri": uri})
        return json.loads(result["contents"][0]["text"])


def run_demo(*, live: bool = False) -> None:
    tmpdir = None if live else tempfile.TemporaryDirectory()
    db_path = None if live else str(Path(tmpdir.name) / "demo_kanban.db")

    try:
        with KanbanMCPClient(db_path=db_path) as client:
            print(f"Connected to MCP server: {client.server_info}")

            tools = client.list_tools()
            print(f"\nAvailable tools ({len(tools)}): {[t['name'] for t in tools]}")

            resources = client.list_resources()
            print(f"Available resources ({len(resources)}): {[r['uri'] for r in resources]}")

            # 1. Create a Blocker card in In Progress
            blocker = client.call_tool(
                "create_task",
                {
                    "title": "Provision staging database",
                    "column_slug": "in_progress",
                    "priority": "urgent",
                    "card_type": "blocker",
                    "description": "Needed before release verification can run.",
                    "acceptance_criteria": "Database reachable\nMigrations applied cleanly",
                    "definition_of_done": "Terraform applied\nCredentials stored in vault",
                },
            )
            print(f"\n1. Created blocker card #{blocker['id']}: {blocker['title']}")

            # 2. Create a Blocked card linked to the blocker
            blocked = client.call_tool(
                "create_task",
                {
                    "title": "Run staging smoke tests",
                    "column_slug": "backlog",
                    "priority": "high",
                    "card_type": "blocked",
                    "blocker_ids": [blocker["id"]],
                    "acceptance_criteria": "All API endpoints return 200\nZero console errors",
                },
            )
            print(
                f"2. Created blocked card #{blocked['id']} linked to blockers {blocked['blocker_ids']}"
            )

            # 3. Update blocker DoD checklist & move it to Done
            client.call_tool(
                "update_task",
                {
                    "task_id": blocker["id"],
                    "definition_of_done": "[x] Terraform applied\n[x] Credentials stored in vault",
                },
            )
            moved = client.call_tool(
                "move_task",
                {"task_id": blocker["id"], "column_slug": "done"},
            )
            print(f"3. Moved blocker #{moved['id']} to Done (column_id={moved['column_id']})")

            # 4. Archive the completed blocker, verify Archive resource, then restore it
            archived = client.call_tool("archive_task", {"task_id": blocker["id"]})
            print(f"4. Archived card #{archived['id']} at {archived['archived_at']}")

            archive_snapshot = client.read_resource("kanban://archive")
            print(f"   Archive count via kanban://archive resource: {archive_snapshot['count']}")

            restored = client.call_tool("restore_task", {"task_id": blocker["id"]})
            print(f"5. Restored card #{restored['id']} back to active board")

            # 5. Clean up demo cards
            client.call_tool("delete_task", {"task_id": blocked["id"]})
            client.call_tool("delete_task", {"task_id": blocker["id"]})
            print("6. Cleaned up demo cards successfully.")
    finally:
        if tmpdir is not None:
            tmpdir.cleanup()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the KanbanFlow MCP example client.")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Connect to the workspace's live kanban.db instead of an isolated temporary database.",
    )
    args = parser.parse_args()
    run_demo(live=args.live)


if __name__ == "__main__":
    main()
