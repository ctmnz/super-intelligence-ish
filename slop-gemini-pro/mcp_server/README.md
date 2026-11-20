# KanbanFlow MCP Server

A zero-dependency **Model Context Protocol (MCP)** server over `stdio` (JSON-RPC 2.0) exposing all KanbanFlow task, dependency, and archive operations directly against the SQLite database.

## Files

- `server.py` — MCP stdio server (`kanbanflow-mcp`) implementing `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, and `resources/read`.
- `example_client.py` — Reusable `KanbanMCPClient` class and runnable end-to-end demo script.

## Available MCP Tools

| Tool | Description |
| --- | --- |
| `get_board` | Fetch all columns, ordered active tasks, and archived count |
| `list_columns` | List board columns (`backlog`, `in_progress`, `review`, `done`, etc.) |
| `list_tasks` | Filter active tasks by column, priority, card type, or search query |
| `get_task` | Fetch full card details including AC, DoD, and blocker links |
| `create_task` | Create a standard, `blocked`, or `blocker` card with AC, DoD, and links |
| `update_task` | Update card fields, checklists, priority, card type, or links |
| `move_task` | Move a card to a target column (`column_id` or `column_slug`) and index |
| `delete_task` | Permanently delete a task |
| `list_archived_tasks` | List or search archived Done cards |
| `archive_task` | Archive a completed card in the Done column |
| `archive_done_tasks` | Bulk-archive all cards in the Done column |
| `restore_task` | Restore an archived card back to the board |

## Available MCP Resources

- `kanban://board` — Active board snapshot (JSON)
- `kanban://columns` — Board column metadata (JSON)
- `kanban://archive` — Archived cards list (JSON)

## Run the Example Client

```bash
# Runs a complete MCP lifecycle demo on an isolated temporary DB
python3 mcp_server/example_client.py

# Or run against your workspace's live kanban.db
python3 mcp_server/example_client.py --live
```

## Connect from an MCP Host (Claude Desktop / Cursor / Antigravity)

```json
{
  "mcpServers": {
    "kanbanflow": {
      "command": "python3",
      "args": ["/Users/danielstoinov/GOOLGE-AI/antigravity/initial-tests/kanban-try-agy/mcp_server/server.py"],
      "env": {
        "KANBAN_DB_PATH": "/Users/danielstoinov/GOOLGE-AI/antigravity/initial-tests/kanban-try-agy/kanban.db"
      }
    }
  }
}
```
