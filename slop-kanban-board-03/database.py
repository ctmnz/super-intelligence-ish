import sqlite3
from contextlib import contextmanager

DB_NAME = 'kanban.db'

def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL DEFAULT 'to_do',
                priority TEXT DEFAULT 'Medium'
            )
        ''')
        conn.commit()

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def get_all_tasks():
    with get_db() as conn:
        cursor = conn.execute('SELECT * FROM tasks')
        return [dict(row) for row in cursor.fetchall()]

def add_task(title, description, status='to_do', priority='Medium'):
    with get_db() as conn:
        cursor = conn.execute(
            'INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)',
            (title, description, status, priority)
        )
        conn.commit()
        return cursor.lastrowid

def update_task(task_id, title, description, status, priority='Medium'):
    with get_db() as conn:
        query = 'UPDATE tasks SET '
        updates = []
        params = []
        
        if title is not None:
            updates.append('title = ?')
            params.append(title)
        if description is not None:
            updates.append('description = ?')
            params.append(description)
        if status is not None:
            updates.append('status = ?')
            params.append(status)
        if priority is not None:
            updates.append('priority = ?')
            params.append(priority)
        
        if not updates:
            return
            
        query += ', '.join(updates) + ' WHERE id = ?'
        params.append(task_id)
        
        conn.execute(query, params)
        conn.commit()

def delete_task(task_id):
    with get_db() as conn:
        conn.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
        conn.commit()
