"""OpenAPI 3.1.0 specification builder for the KanbanFlow REST API."""

from __future__ import annotations

from typing import Any

import database as db


def build_openapi_spec(server_url: str = "/") -> dict[str, Any]:
    """Return the complete OpenAPI 3.1.0 specification for all KanbanFlow endpoints."""
    return {
        "openapi": "3.1.0",
        "info": {
            "title": "KanbanFlow API",
            "version": "1.0.0",
            "description": (
                "Local-first Kanban board REST API backed by SQLite. Supports full CRUD on "
                "columns and tasks, Blocked/Blocker card dependencies, Acceptance Criteria & "
                "Definition of Done checklists, task ordering, and Done-card archiving."
            ),
        },
        "servers": [{"url": server_url, "description": "Current KanbanFlow server"}],
        "tags": [
            {"name": "Board", "description": "Aggregated board queries"},
            {"name": "Tasks", "description": "Create, read, update, move, and delete cards"},
            {"name": "Columns", "description": "Manage Kanban columns"},
            {"name": "Archive", "description": "Archive completed Done cards and restore them"},
            {"name": "Health", "description": "Kubernetes liveness & readiness probes"},
        ],
        "paths": {
            "/healthz": {
                "get": {
                    "tags": ["Health"],
                    "summary": "Health check probe",
                    "description": "Verifies that the Flask server can reach SQLite.",
                    "responses": {
                        "200": {
                            "description": "Service and database are healthy",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/HealthResponse"},
                                    "example": {"status": "ok"},
                                }
                            },
                        },
                        "503": {
                            "description": "Database unreachable",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/HealthErrorResponse"}
                                }
                            },
                        },
                    },
                }
            },
            "/api/board": {
                "get": {
                    "tags": ["Board"],
                    "summary": "Get full Kanban board",
                    "description": "Returns all columns populated with ordered active (non-archived) tasks plus the archived task count.",
                    "parameters": [
                        {
                            "name": "priority",
                            "in": "query",
                            "required": False,
                            "schema": {"type": "string", "enum": list(db.VALID_PRIORITIES)},
                            "description": "Filter tasks by priority.",
                        },
                        {
                            "name": "card_type",
                            "in": "query",
                            "required": False,
                            "schema": {"type": "string", "enum": list(db.VALID_CARD_TYPES)},
                            "description": "Filter tasks by card type (task, blocked, blocker).",
                        },
                        {
                            "name": "q",
                            "in": "query",
                            "required": False,
                            "schema": {"type": "string"},
                            "description": "Case-insensitive keyword search across title, description, Acceptance Criteria, and Definition of Done.",
                        },
                    ],
                    "responses": {
                        "200": {
                            "description": "Board snapshot",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "columns": {
                                                "type": "array",
                                                "items": {"$ref": "#/components/schemas/BoardColumn"},
                                            },
                                            "archived_count": {"type": "integer", "example": 2},
                                        },
                                        "required": ["columns", "archived_count"],
                                    }
                                }
                            },
                        }
                    },
                }
            },
            "/api/columns": {
                "get": {
                    "tags": ["Columns"],
                    "summary": "List columns",
                    "responses": {
                        "200": {
                            "description": "Ordered list of board columns",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "columns": {
                                                "type": "array",
                                                "items": {"$ref": "#/components/schemas/Column"},
                                            }
                                        },
                                    }
                                }
                            },
                        }
                    },
                },
                "post": {
                    "tags": ["Columns"],
                    "summary": "Create column",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ColumnCreate"},
                                "example": {"name": "QA Verification", "color": "#8b5cf6"},
                            }
                        },
                    },
                    "responses": {
                        "201": {
                            "description": "Created column",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Column"}
                                }
                            },
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                    },
                },
            },
            "/api/columns/{column_id}": {
                "parameters": [
                    {
                        "name": "column_id",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "integer"},
                    }
                ],
                "put": {
                    "tags": ["Columns"],
                    "summary": "Update column (PUT)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ColumnUpdate"}
                            }
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "Updated column",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Column"}
                                }
                            },
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                },
                "patch": {
                    "tags": ["Columns"],
                    "summary": "Partially update column (PATCH)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ColumnUpdate"}
                            }
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "Updated column",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Column"}
                                }
                            },
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                },
                "delete": {
                    "tags": ["Columns"],
                    "summary": "Delete column",
                    "description": "Deletes the column and cascade-deletes its tasks.",
                    "responses": {
                        "200": {
                            "description": "Column deleted",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/DeleteResponse"}
                                }
                            },
                        },
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                },
            },
            "/api/tasks": {
                "get": {
                    "tags": ["Tasks"],
                    "summary": "List active tasks",
                    "parameters": [
                        {
                            "name": "column_id",
                            "in": "query",
                            "required": False,
                            "schema": {"type": "integer"},
                        },
                        {
                            "name": "priority",
                            "in": "query",
                            "required": False,
                            "schema": {"type": "string", "enum": list(db.VALID_PRIORITIES)},
                        },
                        {
                            "name": "card_type",
                            "in": "query",
                            "required": False,
                            "schema": {"type": "string", "enum": list(db.VALID_CARD_TYPES)},
                        },
                        {
                            "name": "q",
                            "in": "query",
                            "required": False,
                            "schema": {"type": "string"},
                        },
                    ],
                    "responses": {
                        "200": {
                            "description": "Matching active tasks",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "tasks": {
                                                "type": "array",
                                                "items": {"$ref": "#/components/schemas/Task"},
                                            }
                                        },
                                    }
                                }
                            },
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                    },
                },
                "post": {
                    "tags": ["Tasks"],
                    "summary": "Create task",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/TaskCreate"},
                                "example": {
                                    "title": "Deploy staging release",
                                    "column_id": 1,
                                    "description": "Roll out v1.2 to staging environment.",
                                    "acceptance_criteria": "Healthz returns 200\nSmoke suite green",
                                    "definition_of_done": "[x] Tests pass\nCode reviewed",
                                    "priority": "high",
                                    "card_type": "task",
                                    "due_date": "2026-12-01",
                                },
                            }
                        },
                    },
                    "responses": {
                        "201": {
                            "description": "Created task",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Task"}
                                }
                            },
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                },
            },
            "/api/tasks/{task_id}": {
                "parameters": [
                    {
                        "name": "task_id",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "integer"},
                    }
                ],
                "get": {
                    "tags": ["Tasks"],
                    "summary": "Get task by ID",
                    "responses": {
                        "200": {
                            "description": "Task details",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Task"}
                                }
                            },
                        },
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                },
                "put": {
                    "tags": ["Tasks"],
                    "summary": "Update task (PUT)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/TaskUpdate"}
                            }
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "Updated task",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Task"}
                                }
                            },
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                },
                "patch": {
                    "tags": ["Tasks"],
                    "summary": "Partially update task (PATCH)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/TaskUpdate"}
                            }
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "Updated task",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Task"}
                                }
                            },
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                },
                "delete": {
                    "tags": ["Tasks"],
                    "summary": "Delete task permanently",
                    "responses": {
                        "200": {
                            "description": "Task deleted",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/DeleteResponse"}
                                }
                            },
                        },
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                },
            },
            "/api/tasks/{task_id}/move": {
                "patch": {
                    "tags": ["Tasks"],
                    "summary": "Move or reorder task",
                    "description": "Moves a task to a target column and 0-based position, atomically resequencing both source and destination columns.",
                    "parameters": [
                        {
                            "name": "task_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "integer"},
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/TaskMove"},
                                "example": {"column_id": 2, "position": 0},
                            }
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "Moved task",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Task"}
                                }
                            },
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                }
            },
            "/api/archive": {
                "get": {
                    "tags": ["Archive"],
                    "summary": "List archived tasks",
                    "parameters": [
                        {
                            "name": "q",
                            "in": "query",
                            "required": False,
                            "schema": {"type": "string"},
                            "description": "Keyword search across archived task fields.",
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Archived tasks ordered newest-archived first",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "tasks": {
                                                "type": "array",
                                                "items": {
                                                    "$ref": "#/components/schemas/ArchivedTask"
                                                },
                                            },
                                            "count": {"type": "integer"},
                                        },
                                    }
                                }
                            },
                        }
                    },
                }
            },
            "/api/tasks/{task_id}/archive": {
                "post": {
                    "tags": ["Archive"],
                    "summary": "Archive a Done task",
                    "description": "Archives a task currently in the Done column. Returns 400 if the task is not in Done.",
                    "parameters": [
                        {
                            "name": "task_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "integer"},
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Archived task",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Task"}
                                }
                            },
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                }
            },
            "/api/archive/done": {
                "post": {
                    "tags": ["Archive"],
                    "summary": "Archive all Done tasks",
                    "description": "Bulk-archives every active task currently in the Done column.",
                    "responses": {
                        "200": {
                            "description": "Bulk archive result",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "archived_count": {"type": "integer"},
                                            "tasks": {
                                                "type": "array",
                                                "items": {"$ref": "#/components/schemas/Task"},
                                            },
                                        },
                                    }
                                }
                            },
                        }
                    },
                }
            },
            "/api/tasks/{task_id}/restore": {
                "post": {
                    "tags": ["Archive"],
                    "summary": "Restore archived task",
                    "description": "Restores an archived task back to its column (or an optionally specified column_id).",
                    "parameters": [
                        {
                            "name": "task_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "integer"},
                        }
                    ],
                    "requestBody": {
                        "required": False,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/RestoreRequest"}
                            }
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "Restored task",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Task"}
                                }
                            },
                        },
                        "400": {"$ref": "#/components/responses/BadRequest"},
                        "404": {"$ref": "#/components/responses/NotFound"},
                    },
                }
            },
        },
        "components": {
            "responses": {
                "BadRequest": {
                    "description": "Invalid request payload or parameter",
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ErrorResponse"},
                            "example": {"error": "Task title is required."},
                        }
                    },
                },
                "NotFound": {
                    "description": "Resource not found",
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ErrorResponse"},
                            "example": {"error": "Task not found."},
                        }
                    },
                },
            },
            "schemas": {
                "Column": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer", "example": 1},
                        "slug": {"type": "string", "example": "backlog"},
                        "name": {"type": "string", "example": "Backlog"},
                        "position": {"type": "integer", "example": 0},
                        "color": {"type": "string", "example": "#64748b"},
                        "wip_limit": {"type": ["integer", "null"], "example": 5},
                        "created_at": {"type": "string", "format": "date-time"},
                    },
                    "required": ["id", "slug", "name", "position", "color", "created_at"],
                },
                "BoardColumn": {
                    "allOf": [
                        {"$ref": "#/components/schemas/Column"},
                        {
                            "type": "object",
                            "properties": {
                                "tasks": {
                                    "type": "array",
                                    "items": {"$ref": "#/components/schemas/Task"},
                                }
                            },
                            "required": ["tasks"],
                        },
                    ]
                },
                "ColumnCreate": {
                    "type": "object",
                    "required": ["name"],
                    "properties": {
                        "name": {"type": "string"},
                        "color": {"type": "string", "default": "#64748b"},
                        "slug": {"type": "string"},
                        "wip_limit": {"type": ["integer", "null"]},
                    },
                },
                "ColumnUpdate": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "color": {"type": "string"},
                        "position": {"type": "integer"},
                        "wip_limit": {"type": ["integer", "null"]},
                    },
                },
                "Task": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer", "example": 1},
                        "column_id": {"type": "integer", "example": 1},
                        "title": {"type": "string", "example": "Build drag-and-drop task cards"},
                        "description": {"type": "string"},
                        "acceptance_criteria": {
                            "type": "string",
                            "description": "Newline-separated checklist items ('[x] ' marks completed lines).",
                        },
                        "definition_of_done": {
                            "type": "string",
                            "description": "Newline-separated DoD items ('[x] ' marks completed lines).",
                        },
                        "priority": {"type": "string", "enum": list(db.VALID_PRIORITIES)},
                        "card_type": {"type": "string", "enum": list(db.VALID_CARD_TYPES)},
                        "position": {"type": "integer", "example": 0},
                        "due_date": {"type": ["string", "null"], "example": "2026-12-01"},
                        "archived_at": {"type": ["string", "null"], "format": "date-time"},
                        "created_at": {"type": "string", "format": "date-time"},
                        "updated_at": {"type": "string", "format": "date-time"},
                        "blocker_ids": {
                            "type": "array",
                            "items": {"type": "integer"},
                            "description": "IDs of active blocker cards holding up this card.",
                        },
                        "blocking_ids": {
                            "type": "array",
                            "items": {"type": "integer"},
                            "description": "IDs of active cards blocked by this card.",
                        },
                    },
                    "required": [
                        "id",
                        "column_id",
                        "title",
                        "description",
                        "acceptance_criteria",
                        "definition_of_done",
                        "priority",
                        "card_type",
                        "position",
                        "created_at",
                        "updated_at",
                    ],
                },
                "ArchivedTask": {
                    "allOf": [
                        {"$ref": "#/components/schemas/Task"},
                        {
                            "type": "object",
                            "properties": {
                                "column_name": {"type": ["string", "null"], "example": "Done"}
                            },
                        },
                    ]
                },
                "TaskCreate": {
                    "type": "object",
                    "required": ["title"],
                    "properties": {
                        "title": {"type": "string"},
                        "column_id": {"type": "integer"},
                        "description": {"type": "string", "default": ""},
                        "acceptance_criteria": {"type": "string", "default": ""},
                        "definition_of_done": {"type": "string", "default": ""},
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
                        "due_date": {"type": ["string", "null"]},
                        "blocker_ids": {"type": "array", "items": {"type": "integer"}},
                        "blocking_ids": {"type": "array", "items": {"type": "integer"}},
                    },
                },
                "TaskUpdate": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "column_id": {"type": "integer"},
                        "description": {"type": "string"},
                        "acceptance_criteria": {"type": "string"},
                        "definition_of_done": {"type": "string"},
                        "priority": {"type": "string", "enum": list(db.VALID_PRIORITIES)},
                        "card_type": {"type": "string", "enum": list(db.VALID_CARD_TYPES)},
                        "due_date": {"type": ["string", "null"]},
                        "blocker_ids": {"type": "array", "items": {"type": "integer"}},
                        "blocking_ids": {"type": "array", "items": {"type": "integer"}},
                    },
                },
                "TaskMove": {
                    "type": "object",
                    "required": ["column_id"],
                    "properties": {
                        "column_id": {"type": "integer"},
                        "position": {"type": ["integer", "null"]},
                    },
                },
                "RestoreRequest": {
                    "type": "object",
                    "properties": {
                        "column_id": {
                            "type": "integer",
                            "description": "Optional column ID to restore into (defaults to original column).",
                        }
                    },
                },
                "DeleteResponse": {
                    "type": "object",
                    "properties": {
                        "deleted": {"type": "boolean", "example": True},
                        "id": {"type": "integer", "example": 1},
                    },
                },
                "HealthResponse": {
                    "type": "object",
                    "properties": {"status": {"type": "string", "example": "ok"}},
                },
                "HealthErrorResponse": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string", "example": "error"},
                        "detail": {"type": "string"},
                    },
                },
                "ErrorResponse": {
                    "type": "object",
                    "properties": {"error": {"type": "string"}},
                },
            },
        },
    }
