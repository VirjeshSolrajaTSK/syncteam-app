export function renderDashboard(currentUser, tasks, activities) {
    // 1. Configure Role View
    const mgrView = document.getElementById('dashboard-manager');
    const empView = document.getElementById('dashboard-employee');
    
    mgrView.style.display = 'none';
    empView.style.display = 'none';

    if (currentUser.role === 'Owner' || currentUser.role === 'Manager') {
        mgrView.style.display = 'block';
        
        // Compute Metrics
        const openTasks = tasks.filter(t => t.status !== 'Completed');
        const overdueTasks = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date());
        
        document.getElementById('mgr-open-tasks').innerText = openTasks.length;
        document.getElementById('mgr-overdue-tasks').innerText = overdueTasks.length;

        // Render Team Activity (Top 5)
        const activityContainer = document.getElementById('mgr-team-activity');
        activityContainer.innerHTML = activities.slice(0, 5).map(act => `
            <div class="activity-card" style="padding: 10px; background: var(--bg-elevated); margin-bottom: 8px; border-radius: 6px;">
                <div class="time">${new Date(act.createdAt).toLocaleString()}</div>
                <div class="message">${act.message}</div>
            </div>
        `).join('') || '<p class="text-muted">No recent activity.</p>';

    } else {
        empView.style.display = 'block';

        const myTasks = tasks.filter(t => t.assignedTo === currentUser.uid);
        const myOpenTasks = myTasks.filter(t => t.status !== 'Completed');
        
        const today = new Date().toDateString();
        const doneToday = myTasks.filter(t => t.status === 'Completed' && new Date(t.updatedAt).toDateString() === today);

        document.getElementById('emp-my-tasks').innerText = myOpenTasks.length;
        document.getElementById('emp-completed-today').innerText = doneToday.length;

        // Render Action Tasks
        const actionContainer = document.getElementById('emp-action-tasks');
        actionContainer.innerHTML = myOpenTasks.slice(0, 5).map(task => `
            <div class="task-card" style="padding: 12px;">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">Status: <span class="badge status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span></div>
            </div>
        `).join('') || '<p class="text-muted">You have no pending tasks!</p>';
    }
}
