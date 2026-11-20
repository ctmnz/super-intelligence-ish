PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS columns (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    position    INTEGER NOT NULL,
    color       TEXT NOT NULL DEFAULT '#64748b',
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS tasks (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    column_id           INTEGER NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT NOT NULL DEFAULT '',
    acceptance_criteria TEXT NOT NULL DEFAULT '',
    definition_of_done  TEXT NOT NULL DEFAULT '',
    priority            TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    card_type           TEXT NOT NULL DEFAULT 'task'
                        CHECK (card_type IN ('task', 'blocked', 'blocker')),
    position            INTEGER NOT NULL DEFAULT 0,
    due_date            TEXT,
    archived_at         TEXT,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY (column_id) REFERENCES columns (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_blockers (
    blocked_task_id INTEGER NOT NULL,
    blocker_task_id INTEGER NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    PRIMARY KEY (blocked_task_id, blocker_task_id),
    CHECK (blocked_task_id != blocker_task_id),
    FOREIGN KEY (blocked_task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    FOREIGN KEY (blocker_task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_column_position
    ON tasks (column_id, position);

CREATE INDEX IF NOT EXISTS idx_tasks_priority
    ON tasks (priority);

CREATE INDEX IF NOT EXISTS idx_tasks_card_type
    ON tasks (card_type);

CREATE INDEX IF NOT EXISTS idx_tasks_archived
    ON tasks (archived_at);

CREATE INDEX IF NOT EXISTS idx_task_blockers_blocker
    ON task_blockers (blocker_task_id);
