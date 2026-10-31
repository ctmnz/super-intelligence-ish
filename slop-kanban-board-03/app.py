from flask import Flask, jsonify, request, render_template
from database import init_db, get_all_tasks, add_task, update_task, delete_task
import os

app = Flask(__name__)

# Ensure the database is initialized
if not os.path.exists('tasks'):
    # The database file is created automatically by the first connection
    pass

init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = get_all_tasks()
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    title = data.get('title')
    description = data.get('description')
    status = data.get('status', 'to_do')
    priority = data.get('priority', 'Medium')
    
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    
    task_id = add_task(title, description, status, priority)
    return jsonify({'id': task_id, 'title': title, 'description': description, 'status': status, 'priority': priority}), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task_route(task_id):
    data = request.json
    title = data.get('title')
    description = data.get('description')
    status = data.get('status')
    priority = data.get('priority')
    
    if title is None and status is None:
        return jsonify({'error': 'Title or status must be provided'}), 400
        
    # Only include priority if it's provided in the request
    # This prevents overwriting the priority with None
    update_task(
        task_id, 
        title if title is not None else None, 
        description if description is not None else None, 
        status if status is not None else None, 
        priority if priority is not None else 'Medium'
    )
    return jsonify({'message': 'Task updated'})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task_route(task_id):
    delete_task(task_id)
    return jsonify({'message': 'Task deleted'})

if __name__ == '__main__':
    app.run(debug=True, port=8000)
