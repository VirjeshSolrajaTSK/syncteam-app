export function renderActivityTimeline(activities, containerId) {
    const container = document.getElementById(containerId);
    
    if (activities.length === 0) {
        container.innerHTML = `<p class="text-muted text-center" style="margin-top:20px;">No activity recorded yet.</p>`;
        return;
    }

    container.innerHTML = activities.map(act => `
        <div class="activity-card">
            <div class="time">${new Date(act.createdAt).toLocaleString()}</div>
            <div class="message">${act.message}</div>
        </div>
    `).join('');
}
