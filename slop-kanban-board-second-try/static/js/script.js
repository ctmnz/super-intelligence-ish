const modal = document.getElementById('modal-overlay');
const title = document.getElementById('modal-title');
const saveIssueBtn = document.getElementById('save-issue-btn');

let allIssues = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchIssues();
    setupEventListeners();
});

async function fetchIssues() {
    try {
        const response = await fetch('/api/issues');
        const data = await response.json();
        allIssues = data;
        renderBoard(allIssues);
    } catch (err) {
        console.error('Error fetching issues:', err);
    }
}

function renderBoard(groupedData) {
    const container = document.querySelector('.board-container');
    if (!container) return;
    
    container.innerHTML = '';
    const columns = ['To Do', 'In Progress', 'Done', 'Blocked'];
    columns.forEach(status => {
        const columnData = groupedData[status] || [];
        const columnHtml = `
            <div class="column" id="col-${status.replace(' ', '-')}">
                <div class="column-header">
                    ${status} <span class="count">${columnData.length}</span>
                </div>
                <div class="card-list">
                    ${columnData.map(issue => `
                        <div class="card" draggable="true" data-id="${issue.id}" data-status="${status}" onclick="openIssue('${issue.title}', ${issue.id})">
                            <div class="card-title">${issue.title}</div>
                            <div class="card-meta">
                                <span>${issue.id}</span>
                                <span class="badge badge-priority-${issue.priority.toLowerCase()}">${issue.priority}</span>
                            </div>
                            <div class="progress-container">
                                <div class="progress-bar" style="width: 50%;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.innerHTML += columnHtml;
    });
}

function openIssue(name, id) {
    if (id) {
        fetch(`/api/issues/${id}`)
            .then(res => res.json())
            .then(data => {
                title.innerText = data.title;
                modal.style.display = 'flex';
            });
    } else {
        title.innerText = name;
        modal.style.display = 'flex';
    }
}

function closeModal() {
    modal.style.display = 'none';
}

function setupEventListeners() {
    const createBtn = document.getElementById('create-issue-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            title.innerText = "Create New Issue";
            modal.style.display = 'flex';
        });
    }

    if (saveIssueBtn) {
        saveIssueBtn.addEventListener('click', handleCreateIssue);
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filteredGroups = {};
            for (const status in allIssues) {
                filteredGroups[status] = allIssues[status].filter(issue => 
                    issue.title.toLowerCase().includes(query) || 
                    issue.description.toLowerCase().includes(query)
                );
            }
            renderBoard(filteredGroups);
        });
    }

    // Drag and Drop Logic
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('card')) {
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            e.target.style.opacity = '0.5';
        }
    });

    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('card')) {
            e.target.style.opacity = '1';
        }
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const column = e.target.closest('.column');
        if (column) {
            column.classList.add('drag-over');
        }
    });

    document.addEventListener('dragleave', (e) => {
        const column = e.target.closest('.column');
        if (column) {
            column.classList.remove('drag-over');
        }
    });

    document.addEventListener('drop', async (e) => {
        e.preventDefault();
        const column = e.target.closest('.column');
        if (!column) return;
        
        column.classList.remove('drag-over');
        const issueId = e.dataTransfer.getData('text/plain');
        
        if (issueId) {
            const header = column.querySelector('.column-header');
            if (header) {
                // FIXED: Properly extract multi-word statuses like "To Do" or "In Progress"
                // by removing the numeric count at the end of the text.
                let statusText = header.innerText.trim();
                const match = statusText.match(/^(.*)\s+\d+$/);
                if (match) {
                    statusText = match[1].trim();
                } else {
                    // Fallback if no numbers found but still might have extra spaces
                    statusText = statusText.split('\n')[0].trim();
                }
                
                console.log('Dropping issue', issueId, 'into', statusText);
                
                try {
                    const response = await fetch(`/api/issues/${issueId}/status`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ status: statusText })
                    });
                    if (response.ok) {
                        fetchIssues();
                    } else {
                        console.error('Server returned error for update:', response.statusText);
                    }
                } catch (err) {
                    console.error('Network error during drop:', err);
                }
            }
        }
    });
}

async function handleCreateIssue() {
    const titleInput = document.getElementById('issue-title');
    const descInput = document.getElementById('issue-description');
    const assigneeInput = document.getElementById('issue-assignee');
    const priorityInput = document.getElementById('issue-priority');

    if (!titleInput.value) {
        alert('Please enter a title');
        return;
    }

    const payload = {
        title: titleInput.value,
        description: descInput.value,
        assignee: assigneeInput.value,
        priority: priorityInput.value,
        status: 'To Do'
    };

    try {
        const response = await fetch('/api/issues', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            // Clear inputs
            titleInput.value = '';
            descInput.value = '';
            assigneeInput.selectedIndex = 0;
            priorityInput.selectedIndex = 0;
            
            closeModal();
            fetchIssues();
        } else {
            console.error('Error creating issue:', response.statusText);
        }
    } catch (err) {
        console.error('Network error during creation:', err);
    }

}
