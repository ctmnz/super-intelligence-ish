"""Model Context Protocol (MCP) stdio server for KanbanFlow task operations.

Implements JSON-RPC 2.0 over newline-delimited stdio according to the MCP
specification, exposing Kanban board tools and read-only resources backed
directly by the project's SQLite database layer (`database.py`).

Run directly:
    python mcp_server/server.py
    KANBAN_DB_PATH=/path/to/kanban.db python mcp_server/server.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import sys
from typing import Any

# Ensure project root is importable when executed as `python mcp_server/server.py`
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import database as db

SERVER_NAME = "kanbanflow-mcp"
SERVER_VERSION = "1.0.0"
SUPPORTED_PROTOCOL_VERSIONS = ("2025-03-26", "2024-11-05")

# JSON-RPC 2.0 Error Codes
PARSE_ERROR = -32700
INVALID_REQUEST = -32600
METHOD_NOT_FOUND = -32601
INVALID_PARAMS = -32602
INTERNAL_ERROR = -32603


# ---------------------------------------------------------------------------
# Tool & Resource Definitions
# ---------------------------------------------------------------------------

TOOLS: list[dict[str, Any]] = [
    {
        "name": "get_board",
        "description": "Get all Kanban columns with their ordered active tasks and archived count.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "priority": {
                    "type": "string",
                    "enum": list(db.VALID_PRIORITIES),
                    "description": "Optional priority filter.",
                },
                "card_type": {
                    "type": "string",
                    "enum": list(db.VALID_CARD_TYPES),
                    "description": "Optional card type filter (task, blocked, blocker).",
                },
                "query": {
                    "type": "string",
                    "description": "Optional keyword search across title, description, AC, and DoD.",
                },
            },
        },
    },
    {
        "name": "list_columns",
        "description": "List all columns on the Kanban board ordered by position.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_tasks",
        "description": "List active tasks matching optional column, priority, card type, and search filters.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "column_id": {"type": "integer", "description": "Filter by column ID."},
                "column_slug": {
                    "type": "string",
                    "description": "Filter by column slug (e.g., backlog, in_progress, review, done).",
                },
                "priority": {"type": "string", "enum": list(db.VALID_PRIORITIES)},
                "card_type": {"type": "string", "enum": list(db.VALID_CARD_TYPES)},
                "query": {"type": "string", "description": "Keyword search text."},
            },
        },
    },
    {
        "name": "get_task",
        "description": "Get full details of a single task by ID, including Acceptance Criteria, Definition of Done, and blocker links.",
        "inputSchema": {
            "type": "object",
            "required": ["task_id"],
            "properties": {
                "task_id": {"type": "integer", "description": "Task ID."},
            },
        },
    },
    {
        "name": "create_task",
        "description": "Create a new Kanban card in a column (defaults to Backlog).",
        "inputSchema": {
            "type": "object",
            "required": ["title"],
            "properties": {
                "title": {"type": "string", "description": "Card title (required)."},
                "column_id": {"type": "integer", "description": "Target column ID."},
                "column_slug": {
                    "type": "string",
                    "description": "Target column slug (backlog, in_progress, review, done).",
                },
                "description": {"type": "string", "description": "Detailed task description."},
                "acceptance_criteria": {
                    "type": "string",
                    "description": "Newline-separated acceptance criteria (prefix checked lines with '[x] ').",
                },
                "definition_of_done": {
                    "type": "string",
                    "description": "Newline-separated Definition of Done items (prefix checked lines with '[x] ').",
                },
                "priority": {
                    "type": "string",
                    "enum": list(db.VALID_PRIORITIES),
                    "default": "medium",
                },
                "card_type": {
                    "type": "string",
                    "enum": list(db.VALID_CARD_TYPES),
                    "default": "task",
                },
                "due_date": {
                    "type": "string",
                    "description": "Optional due date in YYYY-MM-DD format.",
                },
                "blocker_ids": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "description": "Task IDs blocking this card (when card_type is 'blocked').",
                },
                "blocking_ids": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "description": "Task IDs blocked by this card (when card_type is 'blocker').",
                },
            },
        },
    },
    {
        "name": "update_task",
        "description": "Update an existing Kanban card's fields, checklists, priority, card type, or blocker relationships.",
        "inputSchema": {
            "type": "object",
            "required": ["task_id"],
            "properties": {
                "task_id": {"type": "integer", "description": "ID of the task to update."},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "acceptance_criteria": {"type": "string"},
                "definition_of_done": {"type": "string"},
                "priority": {"type": "string", "enum": list(db.VALID_PRIORITIES)},
                "card_type": {"type": "string", "enum": list(db.VALID_CARD_TYPES)},
                "column_id": {"type": "integer"},
                "column_slug": {"type": "string"},
                "due_date": {"type": ["string", "null"]},
                "blocker_ids": {"type": "array", "items": {"type": "integer"}},
                "blocking_ids": {"type": "array", "items": {"type": "integer"}},
            },
        },
    },
    {
        "name": "move_task",
        "description": "Move a task to another column (by column_id or column_slug) and optional 0-based position.",
        "inputSchema": {
            "type": "object",
            "required": ["task_id"],
            "properties": {
                "task_id": {"type": "integer", "description": "Task ID to move."},
                "column_id": {"type": "integer", "description": "Destination column ID."},
                "column_slug": {
                    "type": "string",
                    "description": "Destination column slug (backlog, in_progress, review, done).",
                },
                "position": {
                    "type": "integer",
                    "description": "Optional 0-based target index within the destination column.",
                },
            },
        },
    },
    {
        "name": "delete_task",
        "description": "Permanently delete a task by ID.",
        "inputSchema": {
            "type": "object",
            "required": ["task_id"],
            "properties": {
                "task_id": {"type": "integer", "description": "Task ID to delete."},
            },
        },
    },
    {
        "name": "list_archived_tasks",
        "description": "List archived (completed) tasks ordered newest-archived first.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Optional keyword filter."},
            },
        },
    },
    {
        "name": "archive_task",
        "description": "Archive a completed task currently in the Done column.",
        "inputSchema": {
            "type": "object",
            "required": ["task_id"],
            "properties": {
                "task_id": {"type": "integer", "description": "ID of the Done task to archive."},
            },
        },
    },
    {
        "name": "archive_done_tasks",
        "description": "Archive all active tasks currently in the Done column.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "restore_task",
        "description": "Restore an archived task back onto the active board.",
        "inputSchema": {
            "type": "object",
            "required": ["task_id"],
            "properties": {
                "task_id": {"type": "integer", "description": "ID of the archived task to restore."},
                "column_id": {"type": "integer", "description": "Optional target column ID."},
                "column_slug": {"type": "string", "description": "Optional target column slug."},
            },
        },
    },
]

RESOURCES: list[dict[str, Any]] = [
    {
        "uri": "kanban://board",
        "name": "Kanban Board",
        "description": "Current board snapshot containing all columns, active tasks, and archived count.",
        "mimeType": "application/json",
    },
    {
        "uri": "kanban://columns",
        "name": "Kanban Columns",
        "description": "Ordered list of columns configured on the board.",
        "mimeType": "application/json",
    },
    {
        "uri": "kanban://archive",
        "name": "Archived Tasks",
        "description": "All archived completed tasks.",
        "mimeType": "application/json",
    },
]


# ---------------------------------------------------------------------------
# MCP Server Implementation
# ---------------------------------------------------------------------------


class KanbanMCPServer:
    """JSON-RPC 2.0 MCP server dispatching Kanban tool and resource requests."""

    def __init__(self, db_path: str | Path | None = None, seed_sample_tasks: bool = True) -> None:
        self.db_path = db_path
        db.init_db(db_path=self.db_path, seed_sample_tasks=seed_sample_tasks)

    def _resolve_column_id(
        self,
        column_id: Any = None,
        column_slug: str | None = None,
        *,
        default_first: bool = False,
    ) -> int | None:
        if column_id is not None:
            try:
                return int(column_id)
            except (TypeError, ValueError) as exc:
                raise ValueError("column_id must be an integer.") from exc

        columns = db.list_columns(db_path=self.db_path)
        if column_slug:
            slug = column_slug.strip().lower().replace("-", "_").replace(" ", "_")
            for col in columns:
                if col["slug"] == slug or col["name"].lower() == column_slug.strip().lower():
                    return int(col["id"])
            available = ", ".join(c["slug"] for c in columns)
            raise LookupError(f"Unknown column_slug '{column_slug}'. Available: {available}")

        if default_first:
            if not columns:
                raise LookupError("No columns exist on the board.")
            return int(columns[0]["id"])
        return None

    @staticmethod
    def _require_int(args: dict[str, Any], key: str) -> int:
        if key not in args or args[key] is None:
            raise ValueError(f"'{key}' is required.")
        try:
            return int(args[key])
        except (TypeError, ValueError) as exc:
            raise ValueError(f"'{key}' must be an integer.") from exc

    def _execute_tool(self, name: str, args: dict[str, Any]) -> Any:
        if name == "get_board":
            return {
                "columns": db.get_board(
                    priority=args.get("priority"),
                    card_type=args.get("card_type"),
                    query=args.get("query"),
                    db_path=self.db_path,
                ),
                "archived_count": db.count_archived_tasks(db_path=self.db_path),
            }

        if name == "list_columns":
            return {"columns": db.list_columns(db_path=self.db_path)}

        if name == "list_tasks":
            col_id = self._resolve_column_id(args.get("column_id"), args.get("column_slug"))
            tasks = db.list_tasks(
                column_id=col_id,
                priority=args.get("priority"),
                card_type=args.get("card_type"),
                query=args.get("query"),
                db_path=self.db_path,
            )
            return {"tasks": tasks, "count": len(tasks)}

        if name == "get_task":
            task_id = self._require_int(args, "task_id")
            task = db.get_task(task_id, db_path=self.db_path)
            if not task:
                raise LookupError(f"Task {task_id} not found.")
            return task

        if name == "create_task":
            title = args.get("title")
            if not isinstance(title, str) or not title.strip():
                raise ValueError("'title' is required and must be a non-empty string.")
            col_id = self._resolve_column_id(
                args.get("column_id"),
                args.get("column_slug"),
                default_first=True,
            )
            assert col_id is not None
            return db.create_task(
                title=title,
                column_id=col_id,
                description=args.get("description", ""),
                acceptance_criteria=args.get("acceptance_criteria", ""),
                definition_of_done=args.get("definition_of_done", ""),
                priority=args.get("priority", "medium"),
                card_type=args.get("card_type", "task"),
                due_date=args.get("due_date"),
                blocker_ids=args.get("blocker_ids"),
                blocking_ids=args.get("blocking_ids"),
                db_path=self.db_path,
            )

        if name == "update_task":
            task_id = self._require_int(args, "task_id")
            kwargs: dict[str, Any] = {"db_path": self.db_path}
            for field in (
                "title",
                "description",
                "acceptance_criteria",
                "definition_of_done",
                "priority",
                "card_type",
                "due_date",
                "blocker_ids",
                "blocking_ids",
            ):
                if field in args:
                    kwargs[field] = args[field]
            if "column_id" in args or "column_slug" in args:
                kwargs["column_id"] = self._resolve_column_id(
                    args.get("column_id"), args.get("column_slug")
                )
            updated = db.update_task(task_id, **kwargs)
            if not updated:
                raise LookupError(f"Task {task_id} not found.")
            return updated

        if name == "move_task":
            task_id = self._require_int(args, "task_id")
            col_id = self._resolve_column_id(args.get("column_id"), args.get("column_slug"))
            if col_id is None:
                raise ValueError("Either 'column_id' or 'column_slug' is required.")
            pos = args.get("position")
            if pos is not None:
                try:
                    pos = int(pos)
                except (TypeError, ValueError) as exc:
                    raise ValueError("'position' must be an integer.") from exc
            moved = db.move_task(task_id, target_column_id=col_id, target_position=pos, db_path=self.db_path)
            if not moved:
                raise LookupError(f"Task {task_id} not found.")
            return moved

        if name == "delete_task":
            task_id = self._require_int(args, "task_id")
            if not db.delete_task(task_id, db_path=self.db_path):
                raise LookupError(f"Task {task_id} not found.")
            return {"deleted": True, "task_id": task_id}

        if name == "list_archived_tasks":
            tasks = db.list_archived_tasks(query=args.get("query"), db_path=self.db_path)
            return {"tasks": tasks, "count": len(tasks)}

        if name == "archive_task":
            task_id = self._require_int(args, "task_id")
            archived = db.archive_task(task_id, db_path=self.db_path)
            if not archived:
                raise LookupError(f"Task {task_id} not found.")
            return archived

        if name == "archive_done_tasks":
            archived = db.archive_done_tasks(db_path=self.db_path)
            return {"archived_count": len(archived), "tasks": archived}

        if name == "restore_task":
            task_id = self._require_int(args, "task_id")
            col_id = self._resolve_column_id(args.get("column_id"), args.get("column_slug"))
            restored = db.restore_task(task_id, target_column_id=col_id, db_path=self.db_path)
            if not restored:
                raise LookupError(f"Task {task_id} not found.")
            return restored

        raise KeyError(f"Unknown tool: {name}")

    def _read_resource(self, uri: str) -> dict[str, Any]:
        if uri == "kanban://board":
            payload = self._execute_tool("get_board", {})
        elif uri == "kanban://columns":
            payload = self._execute_tool("list_columns", {})
        elif uri == "kanban://archive":
            payload = self._execute_tool("list_archived_tasks", {})
        else:
            raise LookupError(f"Unknown resource URI: {uri}")

        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(payload, indent=2),
                }
            ]
        }

    def handle_message(self, message: dict[str, Any]) -> dict[str, Any] | None:
        """Process a single JSON-RPC 2.0 request or notification."""
        if not isinstance(message, dict) or message.get("jsonrpc") != "2.0":
            return self._error(None, INVALID_REQUEST, "Invalid JSON-RPC 2.0 message.")

        method = message.get("method")
        req_id = message.get("id")
        params = message.get("params") or {}

        # Notifications have no 'id' and must not receive a response
        if req_id is None:
            return None

        if not isinstance(method, str):
            return self._error(req_id, INVALID_REQUEST, "Missing or invalid 'method'.")

        try:
            if method == "initialize":
                requested_version = params.get("protocolVersion")
                protocol_version = (
                    requested_version
                    if requested_version in SUPPORTED_PROTOCOL_VERSIONS
                    else SUPPORTED_PROTOCOL_VERSIONS[0]
                )
                return self._result(
                    req_id,
                    {
                        "protocolVersion": protocol_version,
                        "capabilities": {
                            "tools": {"listChanged": False},
                            "resources": {"subscribe": False, "listChanged": False},
                        },
                        "serverInfo": {
                            "name": SERVER_NAME,
                            "version": SERVER_VERSION,
                        },
                    },
                )

            if method == "ping":
                return self._result(req_id, {})

            if method == "tools/list":
                return self._result(req_id, {"tools": TOOLS})

            if method == "tools/call":
                tool_name = params.get("name")
                tool_args = params.get("arguments") or {}
                if not isinstance(tool_name, str) or not isinstance(tool_args, dict):
                    return self._error(req_id, INVALID_PARAMS, "Invalid tools/call parameters.")
                try:
                    data = self._execute_tool(tool_name, tool_args)
                    return self._result(
                        req_id,
                        {
                            "content": [{"type": "text", "text": json.dumps(data, indent=2)}],
                            "structuredContent": data,
                            "isError": False,
                        },
                    )
                except KeyError as exc:
                    return self._error(req_id, METHOD_NOT_FOUND, str(exc))
                except (ValueError, LookupError) as exc:
                    return self._result(
                        req_id,
                        {
                            "content": [{"type": "text", "text": json.dumps({"error": str(exc)})}],
                            "isError": True,
                        },
                    )

            if method == "resources/list":
                return self._result(req_id, {"resources": RESOURCES})

            if method == "resources/read":
                uri = params.get("uri")
                if not isinstance(uri, str):
                    return self._error(req_id, INVALID_PARAMS, "'uri' string is required.")
                try:
                    return self._result(req_id, self._read_resource(uri))
                except LookupError as exc:
                    return self._error(req_id, INVALID_PARAMS, str(exc))

            return self._error(req_id, METHOD_NOT_FOUND, f"Unsupported method: {method}")
        except Exception as exc:  # pragma: no cover - defensive fallback
            return self._error(req_id, INTERNAL_ERROR, f"Internal server error: {exc}")

    @staticmethod
    def _result(req_id: Any, result: dict[str, Any]) -> dict[str, Any]:
        return {"jsonrpc": "2.0", "id": req_id, "result": result}

    @staticmethod
    def _error(req_id: Any, code: int, message: str) -> dict[str, Any]:
        return {"jsonrpc": "2.0", "id": req_id, "error": {"code": code, "message": message}}

    def run_stdio(self) -> None:
        """Serve MCP JSON-RPC requests line-by-line over stdin/stdout."""
        for raw_line in sys.stdin:
            line = raw_line.strip()
            if not line:
                continue
            try:
                message = json.loads(line)
            except json.JSONDecodeError as exc:
                response = self._error(None, PARSE_ERROR, f"Invalid JSON: {exc}")
                sys.stdout.write(json.dumps(response) + "\n")
                sys.stdout.flush()
                continue

            response = self.handle_message(message)
            if response is not None:
                sys.stdout.write(json.dumps(response) + "\n")
                sys.stdout.flush()


def main() -> None:
    seed = os.environ.get("KANBAN_SEED_SAMPLE_TASKS", "1") != "0"
    server = KanbanMCPServer(seed_sample_tasks=seed)
    server.run_stdio()


if __name__ == "__main__":
    main()
