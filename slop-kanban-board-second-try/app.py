from flask import Flask, request, jsonify, render_template
from database import db, Issue, Comment
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///kanban.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'secret-key-for-session'

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/issues', methods=['GET'])
def get_issues():
    issues = Issue.query.all()
    # Grouping by status for the frontend
    grouped = {}
    for issue in issues:
        if issue.status not in grouped:
            grouped[issue.status] = []
        grouped[issue.status].append(issue.to_dict())
    return jsonify(grouped)

@app.route('/api/issues', methods=['POST'])
def create_issue():
    data = request.json
    new_issue = Issue(
        title=data['title'],
        description=data.get('description', ''),
        status=data.get('status', 'To Do'),
        priority=data.get('priority', 'Medium'),
        assignee=data.get('assignee', 'Unassigned')
    )
    db.session.add(new_issue)
    db.session.commit()
    return jsonify(new_issue.to_dict()), 201

@app.route('/api/issues/<int:issue_id>/status', methods=['PUT'])
def update_status(issue_id):
    issue = Issue.query.get_or_404(issue_id)
    data = request.json
    issue.status = data['status']
    db.session.commit()
    return jsonify({"status": "success", "message": f"Issue {issue_id} moved to {issue.status}"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
