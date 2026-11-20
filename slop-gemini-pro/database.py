"""SQLite database layer for the Kanban board application."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
import os
from pathlib import Path
import re
import sqlite3
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BASE_DIR / "kanban.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"

VALID_PRIORITIES = ("low", "medium", "high", "urgent")
VALID_CARD_TYPES = ("task", "blocked", "blocker")

TASK_COLUMNS_SQL = (
    "id, column_id, title, description, acceptance_criteria, definition_of_done, "
    "priority, card_type, position, due_date, archived_at, created_at, updated_at"
)

DEFAULT_COLUMNS = [
    ("backlog", "Backlog", 0, "#64748b"),
    ("in_progress", "In Progress", 1, "#3b82f6"),
    ("review", "Review", 2, "#f59e0b"),
    ("done", "Done", 3, "#10b981"),
]

STARTER_TASKS = [
    (
        "backlog",
        "Deploy staging environment",
        "Blocked until OAuth keys and DB migration lock are resolved.",
        "high",
        "blocked",
    ),
    (
        "backlog",
        "Write onboarding walkthrough",
        "Document local setup and board workflow for new contributors.",
        "low",
        "task",
    ),
    (
        "in_progress",
        "Provision OAuth credentials",
        "Platform dependency required before staging deployment can proceed.",
        "urgent",
        "blocker",
    ),
    (
        "review",
        "Fix SQLite migration lock",
        "Ensures schema upgrades complete cleanly without blocking startup.",
        "high",
        "blocker",
    ),
    (
        "done",
        "Set up local Kanban workspace",
        "Initialized Flask, Jinja2 templates, SQLite schema, and board UI.",
        "medium",
        "task",
    ),
]


def get_db_path() -> Path:
    """Return the configured SQLite database file path."""
    override = os.environ.get("KANBAN_DB_PATH")
    return Path(override) if override else DEFAULT_DB_PATH


@contextmanager
def get_connection(db_path: Path | str | None = None) -> Iterator[sqlite3.Connection]:
    """Yield a SQLite connection configured with Row factory, foreign keys, and busy timeout."""
    path = Path(db_path) if db_path is not None else get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, timeout=5.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(db_path: Path | str | None = None, seed_sample_tasks: bool = True) -> None:
    """Initialize database tables, apply lightweight migrations, and seed default columns."""
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    with get_connection(db_path) as conn:
        conn.execute("PRAGMA journal_mode = WAL;")
        # Migrate existing tasks table if created before card_type existed
        has_tasks_table = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'tasks'"
        ).fetchone()
        if has_tasks_table:
            existing_cols = {
                row["name"] for row in conn.execute("PRAGMA table_info(tasks)").fetchall()
            }
            if "card_type" not in existing_cols:
                conn.execute(
                    """
                    ALTER TABLE tasks
                    ADD COLUMN card_type TEXT NOT NULL DEFAULT 'task'
                    CHECK (card_type IN ('task', 'blocked', 'blocker'))
                    """
                )
            if "archived_at" not in existing_cols:
                conn.execute("ALTER TABLE tasks ADD COLUMN archived_at TEXT")
            if "acceptance_criteria" not in existing_cols:
                conn.execute(
                    "ALTER TABLE tasks ADD COLUMN acceptance_criteria TEXT NOT NULL DEFAULT ''"
                )
            if "definition_of_done" not in existing_cols:
                conn.execute(
                    "ALTER TABLE tasks ADD COLUMN definition_of_done TEXT NOT NULL DEFAULT ''"
                )

        conn.executescript(schema_sql)

        existing_columns = conn.execute("SELECT COUNT(*) FROM columns").fetchone()[0]
        if existing_columns == 0:
            conn.executemany(
                "INSERT INTO columns (slug, name, position, color) VALUES (?, ?, ?, ?)",
                DEFAULT_COLUMNS,
            )
            if seed_sample_tasks:
                slug_to_id = {
                    row["slug"]: row["id"]
                    for row in conn.execute("SELECT id, slug FROM columns").fetchall()
                }
                positions: dict[int, int] = {}
                created_by_title: dict[str, int] = {}
                for slug, title, description, priority, card_type in STARTER_TASKS:
                    col_id = slug_to_id[slug]
                    pos = positions.get(col_id, 0)
                    cur = conn.execute(
                        """
                        INSERT INTO tasks (column_id, title, description, priority, card_type, position)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (col_id, title, description, priority, card_type, pos),
                    )
                    created_by_title[title] = int(cur.lastrowid)
                    positions[col_id] = pos + 1

                # Link starter blocked task to both starter blockers
                blocked_id = created_by_title.get("Deploy staging environment")
                for blocker_title in ("Provision OAuth credentials", "Fix SQLite migration lock"):
                    blocker_id = created_by_title.get(blocker_title)
                    if blocked_id and blocker_id:
                        conn.execute(
                            "INSERT OR IGNORE INTO task_blockers (blocked_task_id, blocker_task_id) VALUES (?, ?)",
                            (blocked_id, blocker_id),
                        )
        conn.commit()


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.strip().lower()).strip("_")
    return slug or "column"


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return dict(row)


def _attach_dependencies(
    conn: sqlite3.Connection, tasks: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Attach blocker_ids and blocking_ids lists to each task dict in one query."""
    if not tasks:
        return tasks

    blockers_map: dict[int, list[int]] = {t["id"]: [] for t in tasks}
    blocking_map: dict[int, list[int]] = {t["id"]: [] for t in tasks}

    rows = conn.execute(
        """
        SELECT tb.blocked_task_id, tb.blocker_task_id
        FROM task_blockers tb
        JOIN tasks t1 ON t1.id = tb.blocked_task_id AND t1.archived_at IS NULL
        JOIN tasks t2 ON t2.id = tb.blocker_task_id AND t2.archived_at IS NULL
        ORDER BY tb.blocker_task_id ASC
        """
    ).fetchall()
    for row in rows:
        blocked_id = row["blocked_task_id"]
        blocker_id = row["blocker_task_id"]
        if blocked_id in blockers_map:
            blockers_map[blocked_id].append(blocker_id)
        if blocker_id in blocking_map:
            blocking_map[blocker_id].append(blocked_id)

    for task in tasks:
        task["blocker_ids"] = blockers_map[task["id"]]
        task["blocking_ids"] = blocking_map[task["id"]]
    return tasks


def _parse_id_list(raw_ids: Any, field_name: str) -> list[int]:
    if raw_ids is None:
        return []
    if not isinstance(raw_ids, list):
        raise ValueError(f"{field_name} must be a list of task IDs.")
    result: list[int] = []
    seen: set[int] = set()
    for item in raw_ids:
        try:
            val = int(item)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{field_name} entries must be integers.") from exc
        if val not in seen:
            seen.add(val)
            result.append(val)
    return result


def _sync_task_dependencies(
    conn: sqlite3.Connection,
    task_id: int,
    card_type: str,
    blocker_ids: list[int] | None,
    blocking_ids: list[int] | None,
) -> None:
    """Persist blocker/blocked relationships cleanly and keep card types consistent."""
    if card_type == "task":
        # Reverting a card to standard clears its blocker links
        conn.execute(
            "DELETE FROM task_blockers WHERE blocked_task_id = ? OR blocker_task_id = ?",
            (task_id, task_id),
        )
        return

    if card_type == "blocked":
        # A blocked card cannot simultaneously be a blocker in this model
        conn.execute("DELETE FROM task_blockers WHERE blocker_task_id = ?", (task_id,))
        if blocker_ids is not None:
            if task_id in blocker_ids:
                raise ValueError("A card cannot block itself.")
            if blocker_ids:
                placeholders = ",".join("?" for _ in blocker_ids)
                found = {
                    row["id"]
                    for row in conn.execute(
                        f"SELECT id FROM tasks WHERE id IN ({placeholders})", blocker_ids
                    ).fetchall()
                }
                missing = [bid for bid in blocker_ids if bid not in found]
                if missing:
                    raise LookupError(f"Blocker task(s) not found: {missing}")

            conn.execute("DELETE FROM task_blockers WHERE blocked_task_id = ?", (task_id,))
            for bid in blocker_ids:
                conn.execute(
                    "INSERT OR IGNORE INTO task_blockers (blocked_task_id, blocker_task_id) VALUES (?, ?)",
                    (task_id, bid),
                )
                # Ensure linked blocker is marked as a blocker if it was a plain task
                conn.execute(
                    "UPDATE tasks SET card_type = 'blocker' WHERE id = ? AND card_type = 'task'",
                    (bid,),
                )

    elif card_type == "blocker":
        conn.execute("DELETE FROM task_blockers WHERE blocked_task_id = ?", (task_id,))
        if blocking_ids is not None:
            if task_id in blocking_ids:
                raise ValueError("A card cannot block itself.")
            if blocking_ids:
                placeholders = ",".join("?" for _ in blocking_ids)
                found = {
                    row["id"]
                    for row in conn.execute(
                        f"SELECT id FROM tasks WHERE id IN ({placeholders})", blocking_ids
                    ).fetchall()
                }
                missing = [tid for tid in blocking_ids if tid not in found]
                if missing:
                    raise LookupError(f"Blocked task(s) not found: {missing}")

            conn.execute("DELETE FROM task_blockers WHERE blocker_task_id = ?", (task_id,))
            for tid in blocking_ids:
                conn.execute(
                    "INSERT OR IGNORE INTO task_blockers (blocked_task_id, blocker_task_id) VALUES (?, ?)",
                    (tid, task_id),
                )
                # Ensure linked dependent card is marked as blocked if it was a plain task
                conn.execute(
                    "UPDATE tasks SET card_type = 'blocked' WHERE id = ? AND card_type = 'task'",
                    (tid,),
                )


# ---------------------------------------------------------------------------
# Column CRUD
# ---------------------------------------------------------------------------


def list_columns(db_path: Path | str | None = None) -> list[dict[str, Any]]:
    """Return all columns ordered by position."""
    with get_connection(db_path) as conn:
        rows = conn.execute(
            "SELECT id, slug, name, position, color, created_at FROM columns ORDER BY position ASC, id ASC"
        ).fetchall()
        return [_row_to_dict(r) for r in rows]


def get_column(column_id: int, db_path: Path | str | None = None) -> dict[str, Any] | None:
    """Fetch a single column by ID."""
    with get_connection(db_path) as conn:
        row = conn.execute(
            "SELECT id, slug, name, position, color, created_at FROM columns WHERE id = ?",
            (column_id,),
        ).fetchone()
        return _row_to_dict(row) if row else None


def create_column(
    name: str,
    color: str = "#64748b",
    slug: str | None = None,
    db_path: Path | str | None = None,
) -> dict[str, Any]:
    """Create a new column appended to the end of the board."""
    clean_name = name.strip()
    if not clean_name:
        raise ValueError("Column name is required.")

    base_slug = _slugify(slug or clean_name)

    with get_connection(db_path) as conn:
        candidate_slug = base_slug
        suffix = 2
        while conn.execute("SELECT 1 FROM columns WHERE slug = ?", (candidate_slug,)).fetchone():
            candidate_slug = f"{base_slug}_{suffix}"
            suffix += 1

        max_pos = conn.execute("SELECT COALESCE(MAX(position), -1) FROM columns").fetchone()[0]
        cursor = conn.execute(
            "INSERT INTO columns (slug, name, position, color) VALUES (?, ?, ?, ?)",
            (candidate_slug, clean_name, max_pos + 1, color.strip() or "#64748b"),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, slug, name, position, color, created_at FROM columns WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return _row_to_dict(row)


def update_column(
    column_id: int,
    *,
    name: str | None = None,
    color: str | None = None,
    position: int | None = None,
    db_path: Path | str | None = None,
) -> dict[str, Any] | None:
    """Update a column's name, color, or position."""
    with get_connection(db_path) as conn:
        existing = conn.execute("SELECT * FROM columns WHERE id = ?", (column_id,)).fetchone()
        if not existing:
            return None

        new_name = existing["name"] if name is None else name.strip()
        if not new_name:
            raise ValueError("Column name cannot be empty.")
        new_color = existing["color"] if color is None else (color.strip() or existing["color"])
        new_pos = existing["position"] if position is None else int(position)

        conn.execute(
            "UPDATE columns SET name = ?, color = ?, position = ? WHERE id = ?",
            (new_name, new_color, new_pos, column_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, slug, name, position, color, created_at FROM columns WHERE id = ?",
            (column_id,),
        ).fetchone()
        return _row_to_dict(row)


def delete_column(column_id: int, db_path: Path | str | None = None) -> bool:
    """Delete a column and cascade-delete its tasks."""
    with get_connection(db_path) as conn:
        cursor = conn.execute("DELETE FROM columns WHERE id = ?", (column_id,))
        conn.commit()
        return cursor.rowcount > 0


# ---------------------------------------------------------------------------
# Task CRUD & Board Queries
# ---------------------------------------------------------------------------


def _resequence_column(conn: sqlite3.Connection, column_id: int) -> None:
    """Normalize active task positions within a column to contiguous 0..N-1 integers."""
    rows = conn.execute(
        "SELECT id FROM tasks WHERE column_id = ? AND archived_at IS NULL ORDER BY position ASC, id ASC",
        (column_id,),
    ).fetchall()
    for idx, row in enumerate(rows):
        conn.execute("UPDATE tasks SET position = ? WHERE id = ?", (idx, row["id"]))


def list_tasks(
    *,
    column_id: int | None = None,
    priority: str | None = None,
    card_type: str | None = None,
    query: str | None = None,
    include_archived: bool = False,
    db_path: Path | str | None = None,
) -> list[dict[str, Any]]:
    """Return tasks matching optional column, priority, card_type, and keyword filters."""
    clauses: list[str] = []
    params: list[Any] = []

    if not include_archived:
        clauses.append("archived_at IS NULL")

    if column_id is not None:
        clauses.append("column_id = ?")
        params.append(column_id)

    if priority:
        p = priority.strip().lower()
        if p in VALID_PRIORITIES:
            clauses.append("priority = ?")
            params.append(p)

    if card_type:
        ct = card_type.strip().lower()
        if ct in VALID_CARD_TYPES:
            clauses.append("card_type = ?")
            params.append(ct)

    if query and query.strip():
        like = f"%{query.strip()}%"
        clauses.append(
            "(title LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE "
            "OR acceptance_criteria LIKE ? COLLATE NOCASE OR definition_of_done LIKE ? COLLATE NOCASE)"
        )
        params.extend([like, like, like, like])

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"""
        SELECT {TASK_COLUMNS_SQL}
        FROM tasks
        {where_sql}
        ORDER BY column_id ASC, position ASC, id ASC
    """
    with get_connection(db_path) as conn:
        rows = conn.execute(sql, params).fetchall()
        return _attach_dependencies(conn, [_row_to_dict(r) for r in rows])


def list_archived_tasks(
    *,
    query: str | None = None,
    db_path: Path | str | None = None,
) -> list[dict[str, Any]]:
    """Return archived tasks ordered newest-archived first."""
    clauses = ["t.archived_at IS NOT NULL"]
    params: list[Any] = []

    if query and query.strip():
        like = f"%{query.strip()}%"
        clauses.append(
            "(t.title LIKE ? COLLATE NOCASE OR t.description LIKE ? COLLATE NOCASE "
            "OR t.acceptance_criteria LIKE ? COLLATE NOCASE OR t.definition_of_done LIKE ? COLLATE NOCASE)"
        )
        params.extend([like, like, like, like])

    sql = f"""
        SELECT
            t.id, t.column_id, t.title, t.description, t.acceptance_criteria, t.definition_of_done,
            t.priority, t.card_type, t.position, t.due_date, t.archived_at, t.created_at, t.updated_at,
            c.name AS column_name
        FROM tasks t
        LEFT JOIN columns c ON c.id = t.column_id
        WHERE {' AND '.join(clauses)}
        ORDER BY t.archived_at DESC, t.id DESC
    """
    with get_connection(db_path) as conn:
        rows = conn.execute(sql, params).fetchall()
        return [_row_to_dict(r) for r in rows]


def count_archived_tasks(db_path: Path | str | None = None) -> int:
    """Return total number of archived tasks."""
    with get_connection(db_path) as conn:
        return int(
            conn.execute("SELECT COUNT(*) FROM tasks WHERE archived_at IS NOT NULL").fetchone()[0]
        )


def archive_task(task_id: int, db_path: Path | str | None = None) -> dict[str, Any] | None:
    """Archive a completed (Done) task, removing it from the active board."""
    with get_connection(db_path) as conn:
        row = conn.execute(
            """
            SELECT t.*, c.slug AS column_slug
            FROM tasks t
            JOIN columns c ON c.id = t.column_id
            WHERE t.id = ?
            """,
            (task_id,),
        ).fetchone()
        if not row:
            return None
        if row["archived_at"] is not None:
            return _row_to_dict(
                conn.execute(f"SELECT {TASK_COLUMNS_SQL} FROM tasks WHERE id = ?", (task_id,)).fetchone()
            )
        if row["column_slug"] != "done":
            raise ValueError("Only tasks in the Done column can be archived.")

        conn.execute(
            """
            UPDATE tasks
            SET archived_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
                updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
            WHERE id = ?
            """,
            (task_id,),
        )
        _resequence_column(conn, row["column_id"])
        conn.commit()
        updated = conn.execute(
            f"SELECT {TASK_COLUMNS_SQL} FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
        return _row_to_dict(updated)


def archive_done_tasks(db_path: Path | str | None = None) -> list[dict[str, Any]]:
    """Archive all active tasks currently in the Done column."""
    with get_connection(db_path) as conn:
        done_col = conn.execute("SELECT id FROM columns WHERE slug = 'done'").fetchone()
        if not done_col:
            return []
        done_id = done_col["id"]
        ids = [
            r["id"]
            for r in conn.execute(
                "SELECT id FROM tasks WHERE column_id = ? AND archived_at IS NULL",
                (done_id,),
            ).fetchall()
        ]
        if not ids:
            return []

        conn.execute(
            """
            UPDATE tasks
            SET archived_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
                updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
            WHERE column_id = ? AND archived_at IS NULL
            """,
            (done_id,),
        )
        conn.commit()
        placeholders = ",".join("?" for _ in ids)
        rows = conn.execute(
            f"SELECT {TASK_COLUMNS_SQL} FROM tasks WHERE id IN ({placeholders}) ORDER BY id ASC",
            ids,
        ).fetchall()
        return [_row_to_dict(r) for r in rows]


def restore_task(
    task_id: int,
    target_column_id: int | None = None,
    db_path: Path | str | None = None,
) -> dict[str, Any] | None:
    """Restore an archived task back to the active board."""
    with get_connection(db_path) as conn:
        existing = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not existing:
            return None

        col_id = existing["column_id"] if target_column_id is None else int(target_column_id)
        col = conn.execute("SELECT id FROM columns WHERE id = ?", (col_id,)).fetchone()
        if not col:
            raise LookupError(f"Column {col_id} does not exist.")

        max_pos = conn.execute(
            "SELECT COALESCE(MAX(position), -1) FROM tasks WHERE column_id = ? AND archived_at IS NULL",
            (col_id,),
        ).fetchone()[0]

        conn.execute(
            """
            UPDATE tasks
            SET archived_at = NULL,
                column_id = ?,
                position = ?,
                updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
            WHERE id = ?
            """,
            (col_id, max_pos + 1, task_id),
        )
        _resequence_column(conn, col_id)
        conn.commit()
        row = conn.execute(
            f"SELECT {TASK_COLUMNS_SQL} FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
        return _attach_dependencies(conn, [_row_to_dict(row)])[0]


def get_board(
    *,
    priority: str | None = None,
    card_type: str | None = None,
    query: str | None = None,
    db_path: Path | str | None = None,
) -> list[dict[str, Any]]:
    """Return all columns populated with their ordered tasks."""
    columns = list_columns(db_path=db_path)
    tasks = list_tasks(priority=priority, card_type=card_type, query=query, db_path=db_path)
    tasks_by_col: dict[int, list[dict[str, Any]]] = {col["id"]: [] for col in columns}
    for task in tasks:
        if task["column_id"] in tasks_by_col:
            tasks_by_col[task["column_id"]].append(task)
    for col in columns:
        col["tasks"] = tasks_by_col[col["id"]]
    return columns


def get_task(task_id: int, db_path: Path | str | None = None) -> dict[str, Any] | None:
    """Fetch a single task by ID."""
    with get_connection(db_path) as conn:
        row = conn.execute(
            f"SELECT {TASK_COLUMNS_SQL} FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()
        if not row:
            return None
        return _attach_dependencies(conn, [_row_to_dict(row)])[0]


def create_task(
    *,
    title: str,
    column_id: int,
    description: str = "",
    acceptance_criteria: str = "",
    definition_of_done: str = "",
    priority: str = "medium",
    card_type: str = "task",
    due_date: str | None = None,
    blocker_ids: list[int] | None = None,
    blocking_ids: list[int] | None = None,
    db_path: Path | str | None = None,
) -> dict[str, Any]:
    """Create a new task appended to the target column, with optional blocker links."""
    clean_title = title.strip()
    if not clean_title:
        raise ValueError("Task title is required.")

    clean_priority = (priority or "medium").strip().lower()
    if clean_priority not in VALID_PRIORITIES:
        raise ValueError(f"Priority must be one of: {', '.join(VALID_PRIORITIES)}.")

    clean_card_type = (card_type or "task").strip().lower()
    if clean_card_type not in VALID_CARD_TYPES:
        raise ValueError(f"Card type must be one of: {', '.join(VALID_CARD_TYPES)}.")

    clean_due = due_date.strip() if isinstance(due_date, str) and due_date.strip() else None
    parsed_blockers = _parse_id_list(blocker_ids, "blocker_ids") if blocker_ids is not None else None
    parsed_blocking = _parse_id_list(blocking_ids, "blocking_ids") if blocking_ids is not None else None

    with get_connection(db_path) as conn:
        col = conn.execute("SELECT id FROM columns WHERE id = ?", (column_id,)).fetchone()
        if not col:
            raise LookupError(f"Column {column_id} does not exist.")

        max_pos = conn.execute(
            "SELECT COALESCE(MAX(position), -1) FROM tasks WHERE column_id = ? AND archived_at IS NULL",
            (column_id,),
        ).fetchone()[0]

        cursor = conn.execute(
            """
            INSERT INTO tasks (
                column_id, title, description, acceptance_criteria, definition_of_done,
                priority, card_type, position, due_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                column_id,
                clean_title,
                (description or "").strip(),
                (acceptance_criteria or "").strip(),
                (definition_of_done or "").strip(),
                clean_priority,
                clean_card_type,
                max_pos + 1,
                clean_due,
            ),
        )
        new_id = int(cursor.lastrowid)
        _sync_task_dependencies(conn, new_id, clean_card_type, parsed_blockers, parsed_blocking)
        conn.commit()

        row = conn.execute(
            f"SELECT {TASK_COLUMNS_SQL} FROM tasks WHERE id = ?",
            (new_id,),
        ).fetchone()
        return _attach_dependencies(conn, [_row_to_dict(row)])[0]


def update_task(
    task_id: int,
    *,
    title: str | None = None,
    description: str | None = None,
    acceptance_criteria: str | None = None,
    definition_of_done: str | None = None,
    priority: str | None = None,
    card_type: str | None = None,
    column_id: int | None = None,
    due_date: str | None = ...,  # type: ignore[assignment]
    blocker_ids: list[int] | None = ...,  # type: ignore[assignment]
    blocking_ids: list[int] | None = ...,  # type: ignore[assignment]
    db_path: Path | str | None = None,
) -> dict[str, Any] | None:
    """Update task fields, dependencies, and optionally move it to another column."""
    parsed_blockers = (
        None
        if blocker_ids is ...
        else _parse_id_list(blocker_ids, "blocker_ids")
    )
    parsed_blocking = (
        None
        if blocking_ids is ...
        else _parse_id_list(blocking_ids, "blocking_ids")
    )

    with get_connection(db_path) as conn:
        existing = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not existing:
            return None

        new_title = existing["title"] if title is None else title.strip()
        if not new_title:
            raise ValueError("Task title cannot be empty.")

        new_description = (
            existing["description"] if description is None else description.strip()
        )
        new_ac = (
            existing["acceptance_criteria"]
            if acceptance_criteria is None
            else acceptance_criteria.strip()
        )
        new_dod = (
            existing["definition_of_done"]
            if definition_of_done is None
            else definition_of_done.strip()
        )

        new_priority = (
            existing["priority"] if priority is None else priority.strip().lower()
        )
        if new_priority not in VALID_PRIORITIES:
            raise ValueError(f"Priority must be one of: {', '.join(VALID_PRIORITIES)}.")

        new_card_type = (
            existing["card_type"] if card_type is None else card_type.strip().lower()
        )
        if new_card_type not in VALID_CARD_TYPES:
            raise ValueError(f"Card type must be one of: {', '.join(VALID_CARD_TYPES)}.")

        if due_date is ...:
            new_due = existing["due_date"]
        else:
            new_due = due_date.strip() if isinstance(due_date, str) and due_date.strip() else None

        old_column_id = existing["column_id"]
        new_column_id = old_column_id if column_id is None else int(column_id)
        new_position = existing["position"]

        if new_column_id != old_column_id:
            col = conn.execute("SELECT id FROM columns WHERE id = ?", (new_column_id,)).fetchone()
            if not col:
                raise LookupError(f"Column {new_column_id} does not exist.")
            max_pos = conn.execute(
                "SELECT COALESCE(MAX(position), -1) FROM tasks WHERE column_id = ? AND archived_at IS NULL",
                (new_column_id,),
            ).fetchone()[0]
            new_position = max_pos + 1

        conn.execute(
            """
            UPDATE tasks
            SET title = ?,
                description = ?,
                acceptance_criteria = ?,
                definition_of_done = ?,
                priority = ?,
                card_type = ?,
                column_id = ?,
                position = ?,
                due_date = ?,
                updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
            WHERE id = ?
            """,
            (
                new_title,
                new_description,
                new_ac,
                new_dod,
                new_priority,
                new_card_type,
                new_column_id,
                new_position,
                new_due,
                task_id,
            ),
        )

        _sync_task_dependencies(
            conn,
            task_id,
            new_card_type,
            parsed_blockers,
            parsed_blocking,
        )

        if new_column_id != old_column_id:
            _resequence_column(conn, old_column_id)
            _resequence_column(conn, new_column_id)

        conn.commit()
        row = conn.execute(
            f"SELECT {TASK_COLUMNS_SQL} FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()
        return _attach_dependencies(conn, [_row_to_dict(row)])[0]


def move_task(
    task_id: int,
    target_column_id: int,
    target_position: int | None = None,
    db_path: Path | str | None = None,
) -> dict[str, Any] | None:
    """Move a task to a target column and exact index, resequencing positions atomically."""
    with get_connection(db_path) as conn:
        existing = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not existing:
            return None

        col = conn.execute("SELECT id FROM columns WHERE id = ?", (target_column_id,)).fetchone()
        if not col:
            raise LookupError(f"Column {target_column_id} does not exist.")

        source_column_id = existing["column_id"]

        target_ids = [
            row["id"]
            for row in conn.execute(
                "SELECT id FROM tasks WHERE column_id = ? AND id != ? AND archived_at IS NULL ORDER BY position ASC, id ASC",
                (target_column_id, task_id),
            ).fetchall()
        ]

        if target_position is None or target_position < 0 or target_position > len(target_ids):
            insert_at = len(target_ids)
        else:
            insert_at = target_position

        target_ids.insert(insert_at, task_id)

        conn.execute(
            """
            UPDATE tasks
            SET column_id = ?,
                updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
            WHERE id = ?
            """,
            (target_column_id, task_id),
        )

        for idx, tid in enumerate(target_ids):
            conn.execute("UPDATE tasks SET position = ? WHERE id = ?", (idx, tid))

        if source_column_id != target_column_id:
            _resequence_column(conn, source_column_id)

        conn.commit()
        row = conn.execute(
            f"SELECT {TASK_COLUMNS_SQL} FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()
        return _attach_dependencies(conn, [_row_to_dict(row)])[0]


def delete_task(task_id: int, db_path: Path | str | None = None) -> bool:
    """Delete a task and resequence its former column."""
    with get_connection(db_path) as conn:
        existing = conn.execute("SELECT column_id FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not existing:
            return False
        conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        _resequence_column(conn, existing["column_id"])
        conn.commit()
        return True
