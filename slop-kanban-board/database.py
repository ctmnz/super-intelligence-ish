import sqlite3
from sqlite3 import Error

def create_connection():
    conn = sqlite3.connect('kanban.db')
    conn.execute('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL, priority TEXT NOT NULL, due_date TEXT, dod TEXT, blocker_id INTEGER)')
    # Add blocker_id column if it doesn't exist
    try:
        conn.execute('ALTER TABLE tasks ADD COLUMN blocker_id INTEGER')
    except sqlite3.OperationalError:
        pass
    conn.commit()
    return conn

def add_task(title, description, status='todo', priority='medium', due_date='', dod='', blocker_id=None):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO tasks (title, description, status, priority, due_date, dod, blocker_id) VALUES (?, ?, ?, ?, ?, ?, ?)', (title, description, status, priority, due_date, dod, blocker_id))
    conn.commit()
    conn.close()
    return cursor.lastrowid

def get_tasks():
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks')
    rows = cursor.fetchall()
    conn.close()
    return rows

def update_task_status(task_id, new_status):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET status = ? WHERE id = ?', (new_status, task_id))
    conn.commit()
    conn.close()

def delete_task(task_id):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()

def update_task_details_dynamic(task_id, **kwargs):
    conn = create_connection()
    cursor = conn.cursor()
    updates = []
    params = []
    for key, value in kwargs.items():
        if key in ['title', 'description', 'priority', 'due_date', 'dod', 'blocker_id']:
            updates.append(f"{key} = ?")
            params.append(value)
    if updates:
        query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?"
        params.append(task_id)
        cursor.execute(query, tuple(params))
        conn.commit()
    conn.close()
