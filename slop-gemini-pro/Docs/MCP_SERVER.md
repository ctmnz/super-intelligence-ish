# MCP Server Guide

KanbanFlow includes a zero-dependency **Model Context Protocol (MCP)** server in `mcp_server/` that speaks JSON-RPC 2.0 over `stdio`, allowing AI assistants and programmatic clients to inspect and manage Kanban tasks directly against SQLite.

---

## Components

- **`mcp_server/server.py`:** Standalone MCP server (`kanbanflow-mcp` v1.0.0) supporting protocol versions `2025-03-26` and `2024-11-05`.
- **`mcp_server/example_client.py`:** Reusable `KanbanMCPClient` context manager plus a runnable CLI demo.

---

## Exposed Tools (12)

| Tool | Required Args | Optional Args | Purpose |
| --- | --- | --- | --- |
| `get_board` | — | `priority`, `card_type`, `query` | Full board snapshot + `archived_count` |
| `list_columns` | — | — | List all board columns |
| `list_tasks` | — | `column_id`, `column_slug`, `priority`, `card_type`, `query` | Filter active tasks |
| `get_task` | `task_id` | — | Detailed task info including AC, DoD & links |
| `create_task` | `title` | `column_id`, `column_slug`, `description`, `acceptance_criteria`, `definition_of_done`, `priority`, `card_type`, `due_date`, `blocker_ids`, `blocking_ids` | Create a new card |
| `update_task` | `task_id` | Any task field, `column_slug`, `blocker_ids`, `blocking_ids` | Modify an existing card |
| `move_task` | `task_id` + (`column_id` or `column_slug`) | `position` | Move/reorder a card |
| `delete_task` | `task_id` | — | Permanently delete a card |
| `list_archived_tasks` | — | `query` | List or search archived Done cards |
| `archive_task` | `task_id` | — | Archive a completed card in `Done` |
| `archive_done_tasks` | — | — | Bulk-archive all active `Done` cards |
| `restore_task` | `task_id` | `column_id`, `column_slug` | Restore an archived card to the board |

> **Tip:** Tools accept human-friendly `column_slug` values (`backlog`, `in_progress`, `review`, `done`) in addition to numeric `column_id`.

---

## Exposed Resources (3)

| URI | MIME Type | Contents |
| --- | --- | --- |
| `kanban://board` | `application/json` | Columns, active tasks, and `archived_count` |
| `kanban://columns` | `application/json` | Ordered column metadata |
| `kanban://archive` | `application/json` | Archived tasks list and count |

---

## Running the Example Client

```bash
# Safe demo against an isolated temporary SQLite database
python3 mcp_server/example_client.py

# Run against your live workspace kanban.db
python3 mcp_server/example_client.py --live
```

### Programmatic Usage

```python
from mcp_server.example_client import KanbanMCPClient

with KanbanMCPClient(db_path="kanban.db") as client:
    card = client.call_tool(
        "create_task",
        {
            "title": "Add metrics dashboard",
            "column_slug": "backlog",
            "priority": "high",
            "acceptance_criteria": "Shows throughput per week",
            "definition_of_done": "Tests pass\nReviewed",
        },
    )
    print("Created:", card["id"])
```

---

## Connecting from an MCP Host

Add the following entry to your MCP host configuration (e.g., Antigravity, Claude Desktop, or Cursor):

```json
{
  "mcpServers": {
    "kanbanflow": {
      "command": "python3",
      "args": ["/absolute/path/to/kanban-try-agy/mcp_server/server.py"],
      "env": {
        "KANBAN_DB_PATH": "/absolute/path/to/kanban-try-agy/kanban.db"
      }
    }
  }
}
```
