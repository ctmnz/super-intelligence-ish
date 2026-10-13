async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

let allTasks = [];

function getTimeRemaining(dateString) {
    if (!dateString || dateString === 'null' || dateString === '') return 'No date';
    const now = new Date();
    const due = new Date(dateString);
    const diffInMs = due - now;
    
    if (diffInMs < 0 || isNaN(diffInMs)) return 'Overdue';
    
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours <= 24) {
        return `<span class="time-urgent">${Math.floor(diffInMs / (1000 * 60 * 60))}h left</span>`;
    } else if (diffInHours <= 168) {
        return `<span class="time-warning">${Math.floor(diffInMs / (1000 * 3600 * 24))} days left</span>`;
    } else {
        return `<span class="time-normal">Due soon</span>`;
    }
}

function renderTasks(tasks) {
    if (tasks)     if (tasks !== undefined) allTasks = tasks;
    const columns = ['blocked', 'todo', 'in-progress', 'done'];
    columns.forEach(col => {
        const container = document.getElementById(`${col}-tasks`);
        const countSpan = document.getElementById(`count-${col}`);
        console.log(`Checking column ${col}: container=${container}, countSpan=${countSpan}`);
        if (!container || !countSpan) return;
    container.innerHTML = '';
    console.log('Rendering tasks:', allTasks);
    const filteredTasks = allTasks.filter(t => t[3] && t[3].trim() === col);
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
                  
                  const priority = task[4] || 'Medium';
                  const priorityClass = priority.toLowerCase() === 'high' ? 'priority-high' : 
                                         priority.toLowerCase() === 'medium' ? 'priority-medium' : 'priority-low';
                  
                  const isOverdue = task[5] && new Date(task[5]) < new Date() && task[3] !== 'done';
                  const overdueClass = isOverdue ? 'overdue-border' : '';
                  
                  let timeText = '';
                  if (task[5] && !isOverdue) {
                      const now = new Date();
                      const due = new Date(task[5]);
                      const diffInMs = due - now;
                      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
                      if (diffInHours <= 24) {
                          timeText = `<span class="time-urgent">${Math.floor(diffInMs / (1000 * 60 * 60))}h left</span>`;
                      } else if (diffInHours <= 168) {
                          timeText = `<span class="time-warning">${Math.floor(diffInMs / (1000 * 3600 * 24))} days left</span>`;
                      } else {
                          timeText = `<span class="time-normal">Due soon</span>`;
                      }
                  } else if (isOverdue) {
                      timeText = `<span class="time-urgent">Overdue</span>`;
                  } else {
                      timeText = `<span>No date</span>`;
                  }
                  
                  if (overdueClass) div.classList.add(overdueClass);
                  
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
                          <span><i class="far fa-calendar"></i> ${timeText}</span>
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
  const columns = ['todo', 'in-progress', 'done'];
  columns.forEach(col => {
    const container = document.getElementById(`${col}-tasks`);
    const countSpan = document.getElementById(`count-${col}`);
    if (!container || !countSpan) return;
    container.innerHTML = '';
    const filtered = allTasks.filter(t => {
      const matchesQuery = t[1].toLowerCase().includes(query) || t[2].toLowerCase().includes(query);
      return t[3] === col && matchesQuery;
    });
    countSpan.textContent = filtered.length;
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-list"></i>
          <p>No tasks found</p>
        </div>
      `;
    } else {
      filtered.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task-card';
        div.setAttribute('draggable', 'true');
        div.setAttribute('data-id', task[0]);
        
        const priority = task[4] || 'Medium';
        const priorityClass = priority.toLowerCase() === 'high' ? 'priority-high' : 
                                  priority.toLowerCase() === 'medium' ? 'priority-medium' : 'priority-low';
        
        const isOverdue = task[5] && new Date(task[5]) < new Date() && task[3] !== 'done';
        const overdueClass = isOverdue ? 'overdue-border' : '';
        
        let timeText = '';
        if (task[5] && !isOverdue) {
          const now = new Date();
          const due = new Date(task[5]);
          const diffInMs = due - now;
          const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
          if (diffInHours <= 24) {
            timeText = `<span class="time-urgent">${Math.floor(diffInMs / (1000 * 60 * 60))}h left</span>`;
          } else if (diffInHours <= 168) {
            timeText = `<span class="time-warning">${Math.floor(diffInMs / (1000 * 3600 * 24))} days left</span>`;
          } else {
            timeText = `<span class="time-normal">Due soon</span>`;
          }
        } else if (isOverdue) {
          timeText = `<span class="time-urgent">Overdue</span>`;
        } else {
          timeText = `<span>No date</span>`;
        }
    
        div.classList.add(overdueClass);
        div.innerHTML = `
          <div class="task-header">
            <span class="priority-badge ${priorityClass}">${priority}</span>
            <strong class="task-title">${task[1]}</strong>
            <button class="delete-btn" onclick="deleteTask(${task[0]})"><i class="fas fa-trash"></i></button>
          </div>
           <p class="task-desc">${query ? task[2].split(query).join(`<mark>${query}</mark>`) : (task[2] || '')}</p>
          <div class="task-info">
            <span><i class="far fa-calendar"></i> ${timeText}</span>
            <span><i class="fas fa-check-square"></i> ${task[6] || 'N/A'}</span>
          </div>
        `;
        container.appendChild(div);
      });
    }
  });
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
  });
  column.addEventListener('drop', (e) => {
    e.preventDefault();
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
    alert('Failed to update status.');
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
      alert('Please enter a task title');
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
      alert('Error adding task');
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
      alert('Failed to delete task');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash"></i>';
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', fetchTasks);

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
