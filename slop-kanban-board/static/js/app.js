function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Simple styles for the toast
    Object.assign(toast.style, {
        padding: '12px 20px',
        margin: '10px',
        borderRadius: '8px',
        backgroundColor: type === 'error' ? '#d63031' : '#27ae60',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '200px',
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '9999',
        transition: 'opacity 0.3s ease',
        opacity: '1'
    });
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const tasks = await response.json();
        allTasks = tasks;
        renderTasks(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        showToast('Failed to load tasks', 'error');
    }
}

let allTasks = [];

function getTaskMetadata(task) {
    const isOverdue = task[5] && new Date(task[5]) < new Date() && task[3] !== 'done';
    let timeText = '';
    if (isOverdue) {
        timeText = `<span class="time-urgent">Overdue</span>`;
    } else if (task[5]) {
        const now = new Date();
        const due = new Date(task[5]);
        const diffInMs = due - now;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        if (diffInHours <= 24) {
            timeText = `<span class="time-urgent">${Math.floor(diffInMs / (1000 * 60 * 60))}h left</span>`;
        } else if (diffInHours <= 48) {
            timeText = `<span class="time-warning">${Math.floor(diffInMs / (1000 * 3600 * 24))} days left</span>`;
        } else if (diffInHours <= 72) {
            timeText = `<span class="time-normal">Due soon</span>`;
        } else {
            timeText = '';
        }
    } else {
        timeText = `<span>No date</span>`;
    }

    return {
        isOverdue,
        overdueClass: isOverdue ? 'overdue-border' : '',
        timeText
    };
}

function renderTasks(tasks) {
    const taskList = tasks || allTasks;
    const columns = ['blocked', 'todo', 'in-progress', 'done'];
    columns.forEach(col => {
        const container = document.getElementById(`${col}-tasks`);
        const countSpan = document.getElementById(`count-${col}`);
        console.log(`Checking column ${col}: container=${container}, countSpan=${countSpan}`);
        if (!container || !countSpan) return;
    container.innerHTML = '';
    console.log('Rendering tasks:', taskList);
    const filteredTasks = taskList.filter(t => t[3] && t[3].trim() === col);
    countSpan.textContent = filteredTasks.length;
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks found in this column.</p>
                <button onclick="document.getElementById('task-title').focus()" class="btn-link">Add one now</button>
            </div>
        `;
    } else {
        filteredTasks.forEach(task => {
            const div = document.createElement('div');
            div.className = 'task-card';
            div.setAttribute('draggable', 'true');
            div.setAttribute('data-id', task[0]);
            div.addEventListener('dragstart', handleDragStart);
            
            const priority = task[4] || 'Medium';
            const priorityClass = priority.toLowerCase() === 'high' ? 'priority-high' : 
            priority.toLowerCase() === 'medium' ? 'priority-medium' : 'priority-low';
            
            const metadata = getTaskMetadata(task);
            if (metadata.isOverdue) div.classList.add(metadata.overdueClass);
            
            // Progressive Disclosure logic for Description
            const isLongDescription = (task[2] && task[2].length > 100);
            let descHTML = task[2] || '';
            if (isLongDescription) {
                descHTML = task[2].substring(0, 100) + '...';
            }
            
            div.innerHTML = `
                <div class="task-header">
                    <span class="priority-badge ${priorityClass}">${priority}</span>
                    <strong class="task-title">${task[1]}</strong>
                    <button class="delete-btn" onclick="deleteTask(${task[0]})"><i class="fas fa-trash"></i></button>
                </div>
                <p class="task-desc" data-full-desc="${task[2] || ''}">${descHTML}</p>
                ${isLongDescription ? `<button class="text-xs" onclick="toggleDesc(this)">Show Full Description</button>` : ''}
                <div class="task-info">
                    <span><i class="far fa-calendar"></i> ${metadata.timeText}</span>
                    <span><i class="fas fa-check-square"></i> ${task[6] || 'N/A'}</span>
                </div>
                <div class="task-actions">
                    ${task[3] !== 'done' ? `<button class="btn-sm" onclick="updateTaskStatus(${task[0]}, 'done')">Done</button>` : ''}
                    ${task[3] === 'in-progress' ? `<button class="btn-sm" onclick="updateTaskStatus(${task[0]}, 'todo')">Unpause</button>` : ''}
                </div>
            `;
            
            div.addEventListener('dragstart', handleDragStart);
            container.appendChild(div);
        });
    }
    
    });
}

function searchTasks() {
    const query = document.getElementById('search-input').value.toLowerCase();
    if (!query) {
        renderTasks(allTasks);
        return;
    }
    const filtered = allTasks.filter(task => {
        const titleMatch = task[1].toLowerCase().includes(query);
        const descMatch = task[2] && task[2].toLowerCase().includes(query);
        return titleMatch || descMatch;
    });
    renderTasks(filtered);
}

let draggedTask = null;
function handleDragStart(e) {
  draggedTask = e.target.closest('.task-card');
  e.dataTransfer.setData('text/plain', draggedTask.getAttribute('data-id'));
  e.dataTransfer.effectAllowed = 'move';
}

document.querySelectorAll('.column').forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      column.classList.add('column-drag-over');
    });
    column.addEventListener('dragleave', (e) => {
      column.classList.remove('column-drag-over');
    });
    column.addEventListener('drop', (e) => {
      e.preventDefault();
      column.classList.remove('column-drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const targetColumn = column.id;
      updateTaskStatus(taskId, targetColumn);
    });
});

async function updateTaskStatus(taskId, newStatus) {
  const taskIndex = allTasks.findIndex(t => t[0] == taskId);
  if (taskIndex === -1) return;
  
  const oldStatus = allTasks[taskIndex][3];
  allTasks[taskIndex][3] = newStatus;
  renderTasks();
  
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!response.ok) throw new Error('Failed to update');
  } catch (error) {
    console.error('Error updating status:', error);
    allTasks[taskIndex][3] = oldStatus;
    renderTasks();
    showToast('Failed to update status', 'error');
  }
}

async function addTask() {
  const title = document.getElementById('task-title').value;
  const priority = document.getElementById('task-priority').value;
  const description = document.getElementById('task-desc').value;
  const dueDate = document.getElementById('task-due-date').value;
  const dod = document.getElementById('task-dod').value;
  const blockerId = document.getElementById('task-blocker-id').value;
  const submitBtn = document.querySelector('.btn-primary');
  
  if (!title) {
    showToast('Please enter a task title', 'error');
    return;
  }
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
  }
  
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        description, 
        status: 'todo', 
        priority, 
        due_date: dueDate,
        dod: dod,
        blocker_id: blockerId ? parseInt(blockerId) : null
      })
    });
    if (response.ok) {
      document.getElementById('task-title').value = '';
      document.getElementById('task-priority').value = 'Medium';
      document.getElementById('task-desc').value = '';
      document.getElementById('task-due-date').value = '';
      document.getElementById('task-dod').value = '';
      document.getElementById('task-blocker-id').value = '';
      fetchTasks();
    } else {
      throw new Error('Failed to add task');
    }
  } catch (error) {
    console.error('Error adding task:', error);
    showToast('Error adding task', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Task';
    }
  }
}

async function deleteTask(taskId) {
  if (confirm("Are you sure you want to delete this task?")) {
    const btn = document.querySelector(`.task-card[data-id="${taskId}"] .delete-btn`);
    if (!btn) return;
    
    try {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash"></i>';
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    initValidation();
});

function initValidation() {
    const titleInput = document.getElementById('task-title');
    if (!titleInput) return;
    
    titleInput.addEventListener('input', () => {
        if (titleInput.value.trim() === '') {
            titleInput.style.borderColor = '#d63031';
        } else {
            titleInput.style.borderColor = '';
        }
    });
}

function toggleDesc(button) {
  const card = button.closest('.task-card');
  if (!card) return;
  const desc = card.querySelector('.task-desc');
  if (!desc) return;
  
  if (desc.innerText.includes('...')) {
    desc.innerText = desc.dataset.fullDesc;
    button.innerText = 'Hide Description';
  } else {
    desc.innerText = desc.dataset.fullDesc.substring(0, 100) + '...';
    button.innerText = 'Show Full Description';
  }
}

/**
 * Toggles the visibility of the task creation modal.
 */
function toggleModal() {
    const modal = document.getElementById('add-task-modal');
    if (modal) {
        modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
    }
}
