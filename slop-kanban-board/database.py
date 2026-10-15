import sqlite3
from sqlite3 import Error

def create_connection():
    conn = sqlite3.connect('kanban.db')
    conn.execute('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL, priority TEXT NOT NULL, due_date TEXT, dod TEXT, blocker_id INTEGER, blockers TEXT)')
    # Add blocking columns
    try:
        conn.execute('ALTER TABLE tasks ADD COLUMN blocker_id INTEGER')
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute('ALTER TABLE tasks ADD COLUMN blockers TEXT')
    except sqlite3.OperationalError:
        pass
    conn.commit()
    return conn
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

def add_blocker(task_id, blocker_id):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT blockers FROM tasks WHERE id = ?', (task_id,))
    row = cursor.fetchone()
    current_blockers = []
    if row and row[0]:
        current_blockers = [int(x) for x in row[0].split(',') if x]
    
    if blocker_id not in current_blockers:
        current_blockers.append(blocker_id)
        new_blockers = ",".join(map(str, current_blockers))
        cursor.execute('UPDATE tasks SET blockers = ? WHERE id = ?', (new_blockers, task_id))
        conn.commit()
    conn.close()

def update_task_details_dynamic(task_id, **kwargs):
    conn = create_connection()
    cursor = conn.cursor()
    
    # List of allowed fields to update dynamically
    allowed_fields = ['title', 'description', 'priority', 'due_date', 'dod']
    
    updates = []
    params = []
    for key, value in kwargs.items():
        if key in allowed_fields:
            updates.append(f"{key} = ?")
            params.append(value)
    
    if updates:
        params.append(task_id)
        query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, tuple(params))
        conn.commit()
    
    conn.close()

