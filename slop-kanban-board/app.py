from flask import Flask, render_template, request, jsonify
from database import add_task, get_tasks, update_task_status, delete_task, update_task_details_dynamic

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def list_tasks():
    tasks = get_tasks()
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    title = data.get('title')
    if not title:
        return jsonify({"message": "Title is required"}), 400
    add_task(
        title,
        data.get('description') or '',
        data.get('status') or 'todo',
        data.get('priority') or 'medium',
        data.get('due_date') or '',
        data.get('dod') or '',
        data.get('blocker_id')
    )
    return jsonify({"message": "Task created"}), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    if 'status' in data and data['status'] != data.get('current_status'): # This logic needs refinement as we don't know current status without fetching it
        update_task_status(task_id, data['status'])
    else:
        # Only update other fields if they are provided in the JSON
        updated_fields = {}
        if 'title' in data: updated_fields['title'] = data['title']
        if 'description' in data: updated_fields['description'] = data['description']
        if 'priority' in data: updated_fields['priority'] = data['priority']
        if 'due_date' in data: updated_fields['due_date'] = data['due_date']
        if 'dod' in data: updated_fields['dod'] = data['dod']
        
        if updated_fields:
            update_task_details_dynamic(task_id, **updated_fields)
    return jsonify({"message": "Task updated"})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task_api(task_id):
    delete_task(task_id)
    return jsonify({"message": "Task deleted"})

@app.route('/api/tasks/<int:task_id>/blockers', methods=['POST'])
def add_task_blocker(task_id):
    data = request.json
    blocker_id = data.get('blocker_id')
    if not blocker_id:
        return jsonify({"message": "Blocker ID is required"}), 400
    add_blocker(task_id, int(blocker_id))
    return jsonify({"message": "Blocker added"})

@app.route('/api/tasks/<int:task_id>/blockers/<int:blocker_id>', methods=['DELETE'])
def remove_task_blocker(task_id, blocker_id):
    remove_blocker(task_id, blocker_id)
    return jsonify({"message": "Blocker removed"})

if __name__ == '__main__':
    app.run(debug=True)
