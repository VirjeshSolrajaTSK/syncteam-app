export function renderTasksList(tasks, containerId, onTaskClick) {
    const container = document.getElementById(containerId);
    
    if (tasks.length === 0) {
        container.innerHTML = `<div class="text-center" style="padding: 40px;"><p class="text-muted">No tasks found.</p></div>`;
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="task-card" data-id="${task.id}">
            <div class="task-card-header">
                <div class="task-title">${task.title}</div>
                <div class="badge status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</div>
            </div>
            <div class="task-meta">
                <span>Priority: <strong class="badge priority-${task.priority.toLowerCase()}">${task.priority}</strong></span> &bull; 
                <span>Due: ${task.dueDate || 'No Date'}</span>
            </div>
        </div>
    `).join('');

    // Attach click listeners
    const cards = container.querySelectorAll('.task-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const taskId = card.getAttribute('data-id');
            const task = tasks.find(t => t.id === taskId);
            onTaskClick(task);
        });
    });
}

export function openTaskDetails(task, currentUser, onUpdateStatus) {
    const modal = document.getElementById('task-details-screen');
    const body = document.getElementById('task-details-body');
    const actions = document.getElementById('task-details-actions');

    body.innerHTML = `
        <div class="task-detail-block">
            <h4>Description</h4>
            <p>${task.description || 'No description provided.'}</p>
        </div>
        <div class="detail-grid">
            <div class="task-detail-block">
                <h4>Status</h4>
                <p><span class="badge status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span></p>
            </div>
            <div class="task-detail-block">
                <h4>Priority</h4>
                <p><span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span></p>
            </div>
            <div class="task-detail-block">
                <h4>Due Date</h4>
                <p>${task.dueDate || 'N/A'}</p>
            </div>
            <div class="task-detail-block">
                <h4>Assigned To</h4>
                <p>${task.assignedToName || task.assignedTo || 'Unassigned'}</p>
            </div>
        </div>
    `;

    actions.innerHTML = '';
    
    // Employee assigned to task can update status
    if (currentUser.uid === task.assignedTo || currentUser.role === 'Owner') {
        const statuses = ['Open', 'In Progress', 'Blocked', 'Completed'];
        const selectHTML = `<select id="status-update-select" style="flex:1; margin:0;">
            ${statuses.map(s => `<option value="${s}" ${s === task.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>`;
        const btnHTML = `<button id="btn-status-save" class="btn-primary" style="flex:1;">Update</button>`;
        
        actions.innerHTML = selectHTML + btnHTML;

        // Needs slight delay to attach listener since we just injected HTML
        setTimeout(() => {
            document.getElementById('btn-status-save').addEventListener('click', () => {
                const newStatus = document.getElementById('status-update-select').value;
                onUpdateStatus(task.id, newStatus);
                modal.classList.remove('active');
            });
        }, 100);
    }

    modal.classList.add('active');
}
