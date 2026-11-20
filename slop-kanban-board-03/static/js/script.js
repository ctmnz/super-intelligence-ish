document.addEventListener('DOMContentLoaded', () => {
    const taskLists = {
        to_do: document.getElementById('list-to_do'),
        in_progress: document.getElementById('list-in_progress'),
        done: document.getElementById('list-done')
    };
  
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskModal = document.getElementById('taskModal');
    const taskForm = document.getElementById('taskForm');
    const submitBtn = document.getElementById('submitBtn');
  
    // Show/Hide Modal
    addTaskBtn.onclick = () => {
        taskModal.style.display = 'flex';
        prepareFormForCreate();
    };
  
    // Close Modal when clicking outside
    taskModal.onclick = (e) => {
        if (e.target === taskModal) {
            taskModal.style.display = 'none';
        }
    };
  // Close Modal with Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && taskModal.style.display === 'flex') {
            taskModal.style.display = 'none';
        }
    });
  
    // Fetch and Render Tasks
    async function fetchTasks() {
        try {
            const response = await fetch('/api/tasks');
            const tasks = await response.json();
            
            // Clear all lists
            Object.values(taskLists).forEach(list => {
                list.innerHTML = '';
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerText = 'No tasks in this column.';
                list.appendChild(emptyState);
            });
            
            tasks.forEach(task => {
                const card = createTaskCard(task);
                // Normalize status for matching: ensure "in_progress" matches "in progress" and is lowercase
                const normalizedStatus = task.status.toLowerCase().replace(' ', '_');
                const list = taskLists[normalizedStatus];
                if (list) {
                    if (list.querySelector('.empty-state')) {
                        list.removeChild(list.querySelector('.empty-state'));
                    }
                    list.appendChild(card);
                } else {
                    // Fallback if status doesn't match any known column (add to to_do)
                    const fallbackList = taskLists['to_do'];
                    if (fallbackList && !fallbackList.querySelector('.empty-state')) {
                        fallbackList.appendChild(card);
                    }
                }
            });
            
            setupSearch();
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }
  
    function setupSearch() {
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const column = e.target.closest('.column');
                const taskCards = column.querySelectorAll('.task-card');
                
                taskCards.forEach(card => {
                    const title = card.querySelector('.task-card-title').innerText.toLowerCase();
                    const description = card.querySelector('p').innerText.toLowerCase();
                    
                    if (title.includes(searchTerm) || description.includes(searchTerm)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }
  
    function createTaskCard(task) {
        const div = document.createElement('div');
        div.className = 'task-card';
        div.draggable = true;
        div.dataset.id = task.id;
        div.dataset.status = task.status;
        div.dataset.task = JSON.stringify(task);
        
        const priority = task.priority || 'Medium';
        const priorityColor = priority.toLowerCase() === 'high' ? 'var(--high-priority)' : 
                              priority.toLowerCase() === 'medium' ? 'var(--medium-priority)' : 'var(--low-priority)';
        
        div.style.borderColor = priorityColor;
        
        const fullDescription = task.description || '';
        const maxChars = 150;
        let displayDescription = fullDescription;
        let isCollapsed = false;

        if (fullDescription.length > maxChars) {
            displayDescription = fullDescription.substring(0, maxChars) + '...';
            isCollapsed = true;
        }

        div.innerHTML = `
            <div class="task-card-header">
                <span class="task-card-title">${task.title}</span>
                <span class="priority-tag" style="background-color: ${priorityColor}">${priority}</span>
            </div>
            <div class="task-description-container">
                <p class="task-description">${displayDescription}</p>
                ${isCollapsed ? `<button class="toggle-description-btn">Show More</button>` : ''}
            </div>
            <div class="card-actions">
                <button class="action-btn complete-btn" title="Mark as done">Done</button>
                <button class="action-btn edit-btn" title="Edit task">Edit</button>
                <button class="action-btn delete-btn" title="Delete task">Delete</button>
            </div>
        `;
        
        if (isCollapsed) {
            const btn = div.querySelector('.toggle-description-btn');
            const p = div.querySelector('.task-description');
            
            // Explicitly track the collapsed state
            div.dataset.collapsed = "true";
            
            btn.onclick = () => {
                const currentlyCollapsed = div.dataset.collapsed === "true";
                if (currentlyCollapsed) {
                    p.innerText = fullDescription;
                    btn.innerText = 'Show Less';
                    div.dataset.collapsed = "false";
                } else {
                    p.innerText = fullDescription.substring(0, maxChars) + '...';
                    btn.innerText = 'Show More';
                    div.dataset.collapsed = "true";
                }
            };
        }
        
        // Complete action
        div.querySelector('.complete-btn').onclick = async () => {
            if (task.status !== 'done') {
                await updateTaskStatus(task.id, 'done');
                fetchTasks();
            }
        };
    
        // Edit action
        div.querySelector('.edit-btn').onclick = () => {
            prepareFormForEdit(task);
        };
    
        // Delete action
        div.querySelector('.delete-btn').onclick = async () => {
            if (confirm('Delete this task?')) {
                await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
                fetchTasks();
            }
        };
    
        // Drag and Drop events
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            div.style.opacity = '0.5';
        });
    
        div.addEventListener('dragend', () => {
            div.style.opacity = '1';
        });
    
        return div;
    }
  
    async function updateTaskStatus(taskId, newStatus) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: newStatus
                })
            });
            if (!response.ok) throw new Error('Failed to update task');
        } catch (error) {
            alert('Error updating task status');
            console.error(error);
        }
    }
  
    // Form management
    function prepareFormForCreate() {
        document.getElementById('task_id').value = '';
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        document.getElementById('priority').value = 'Medium';
        submitBtn.innerText = 'Add Task';
    }
  
    function prepareFormForEdit(task) {
        document.getElementById('task_id').value = task.id;
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description;
        document.getElementById('priority').value = task.priority;
        document.getElementById('task_status').value = task.status;
        submitBtn.innerText = 'Update Task';
        taskModal.style.display = 'flex';
    }
  
    taskForm.onsubmit = async (e) => {
        e.preventDefault();
        const taskId = document.getElementById('task_id').value;
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const priority = document.getElementById('priority').value;
        const status = document.getElementById('task_status').value;
    
        try {
            if (taskId) {
                // Update existing task
                const response = await fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description, priority, status })
                });
                if (!response.ok) throw new Error('Failed to update task');
            } else {
                // Create new task
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description, priority, status: 'to_do' })
                });
                if (!response.ok) throw new Error('Failed to create task');
            }
            
            taskForm.reset();
            document.getElementById('task_id').value = '';
            submitBtn.innerText = 'Add Task';
            taskModal.style.display = 'none';
            fetchTasks();
        } catch (error) {
            alert('Error processing request: ' + error.message);
            console.error(error);
        }
    };
    
    // Drag and Drop Handlers
    Object.values(taskLists).forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            list.style.backgroundColor = '#e0e0e0';
        });
    
        list.addEventListener('dragleave', () => {
            list.style.backgroundColor = 'transparent';
        });
    
        list.addEventListener('drop', async (e) => {
            e.preventDefault();
            list.style.backgroundColor = 'transparent';
            const taskId = e.dataTransfer.getData('text/plain');
            const targetListId = list.id.replace('list-', '');
            
            const taskElement = document.querySelector(`.task-card[data-id="${taskId}"]`);
            if (!taskElement) return;
            
            const oldStatus = taskElement.dataset.status;
            
            if (oldStatus !== targetListId) {
                try {
                    const taskData = JSON.parse(taskElement.dataset.task);
                    const response = await fetch(`/api/tasks/${taskId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            title: taskElement.querySelector('.task-card-title').innerText,
                            description: taskData.description,
                            status: targetListId,
                            priority: taskElement.querySelector('.priority-tag').innerText
                        })
                    });
                    
                    if (response.ok) {
                        fetchTasks();
                    } else {
                        const errorData = await response.json();
                        alert(`Error: ${errorData.error}`);
                    }
                } catch (error) {
                    alert('Error during drag and drop');
                    console.error(error);
                }
            }
        });
    });
    
    fetchTasks();
});
