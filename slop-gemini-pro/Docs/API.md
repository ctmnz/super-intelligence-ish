# REST API & OpenAPI Reference

KanbanFlow exposes a JSON REST API for all board, column, task, dependency, and archive operations, accompanied by a live **OpenAPI 3.1.0** specification and **Swagger UI**.

## Interactive Documentation

- **Swagger UI:** `GET /docs` (alias: `GET /swagger`)
- **OpenAPI 3.1 JSON:** `GET /openapi.json`

---

## Endpoints Overview

### Health
| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/healthz` | Verifies SQLite connectivity (`200 {"status": "ok"}` or `503`) |

### Board
| Method | Path | Query Params | Description |
| --- | --- | --- | --- |
| `GET` | `/api/board` | `priority`, `card_type`, `q` | Returns all columns with ordered active tasks plus `archived_count` |

### Columns
| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/columns` | List all columns ordered by `position` |
| `POST` | `/api/columns` | Create a column (`name`, optional `color`, `slug`) |
| `PUT` / `PATCH` | `/api/columns/<id>` | Update `name`, `color`, or `position` |
| `DELETE` | `/api/columns/<id>` | Delete a column (cascades its tasks) |

### Tasks
| Method | Path | Query Params / Body | Description |
| --- | --- | --- | --- |
| `GET` | `/api/tasks` | `column_id`, `priority`, `card_type`, `q` | List active tasks matching filters |
| `POST` | `/api/tasks` | JSON body | Create a new card (defaults to first column, `medium`, `task`) |
| `GET` | `/api/tasks/<id>` | — | Fetch a single task with `blocker_ids` & `blocking_ids` |
| `PUT` / `PATCH` | `/api/tasks/<id>` | JSON body | Update fields, checklists, card type, or blocker links |
| `PATCH` | `/api/tasks/<id>/move` | `{"column_id": int, "position": int?}` | Move/reorder a task and resequence columns atomically |
| `DELETE` | `/api/tasks/<id>` | — | Permanently delete a task |

### Archive
| Method | Path | Query Params / Body | Description |
| --- | --- | --- | --- |
| `GET` | `/api/archive` | `q` | List archived tasks ordered newest-archived first |
| `POST` | `/api/tasks/<id>/archive` | — | Archive a task in the `Done` column (`400` if not in Done) |
| `POST` | `/api/archive/done` | — | Bulk-archive all active tasks currently in `Done` |
| `POST` | `/api/tasks/<id>/restore` | `{"column_id": int?}` | Restore an archived task back to the board |

---

## Task JSON Schema

```json
{
  "id": 1,
  "column_id": 1,
  "title": "Deploy staging environment",
  "description": "Blocked until OAuth keys are ready.",
  "acceptance_criteria": "[x] Healthz returns 200\nSmoke suite passes",
  "definition_of_done": "[x] Tests pass\nCode reviewed",
  "priority": "high",
  "card_type": "blocked",
  "position": 0,
  "due_date": "2026-12-01",
  "archived_at": null,
  "created_at": "2026-11-21T00:00:00Z",
  "updated_at": "2026-11-21T00:10:00Z",
  "blocker_ids": [3],
  "blocking_ids": []
}
```

---

## Example `curl` Workflows

### Create a Blocker Card and a Linked Blocked Card

```bash
# 1. Create a blocker in In Progress (column_id=2)
curl -s -X POST http://127.0.0.1:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Provision OAuth keys",
    "column_id": 2,
    "priority": "urgent",
    "card_type": "blocker",
    "definition_of_done": "Keys stored in secret manager"
  }'

# 2. Create a blocked card referencing blocker ID 10
curl -s -X POST http://127.0.0.1:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deploy staging build",
    "column_id": 1,
    "priority": "high",
    "card_type": "blocked",
    "blocker_ids": [10],
    "acceptance_criteria": "OAuth login succeeds\n/healthz returns 200"
  }'
```

### Move to Done and Archive

```bash
# Move card #10 to Done (column_id=4)
curl -s -X PATCH http://127.0.0.1:5000/api/tasks/10/move \
  -H "Content-Type: application/json" \
  -d '{"column_id": 4, "position": 0}'

# Archive card #10
curl -s -X POST http://127.0.0.1:5000/api/tasks/10/archive

# Restore card #10 back to Done
curl -s -X POST http://127.0.0.1:5000/api/tasks/10/restore
```

---

## Error Responses

Errors return JSON with an `error` message and standard HTTP status codes (`400` validation error, `404` missing resource, `503` unhealthy DB):

```json
{
  "error": "Only tasks in the Done column can be archived."
}
```
