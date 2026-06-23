import os

app_js_path = "/Users/virjeshsolraja/.gemini/antigravity/scratch/task-tracker-app/www/app.js"

with open(app_js_path, "r") as f:
    content = f.read()

# 1. Replace saveTask
save_task_search = "  function saveTask(e) {"
save_task_replace = """  async function saveTask(e) {
    e.preventDefault();
    const id = elements.taskIdInput.value;
    const title = elements.taskTitleInput.value.trim();
    const description = elements.taskDescInput.value.trim();
    const priority = elements.taskPriorityInput.value;
    const status = elements.taskStatusInput.value;
    const assigneeId = elements.taskAssigneeSelect.value || null;
    const dueDate = elements.taskDueDateInput.value;

    const assignee = assigneeId ? getMember(assigneeId) : null;
    const assigneeName = assignee ? assignee.name : "Entire Team";

    try {
      if (id) {
        // Update Task
        const taskRef = doc(db, "tasks", id);
        const taskIndex = tasks.findIndex(t => t.id === id);
        const oldTask = taskIndex !== -1 ? tasks[taskIndex] : {};
        
        let changeMsg = `Task "${title}" updated.`;
        if (oldTask.status !== status) changeMsg += ` Status updated to ${status.replace("_", " ")}.`;
        if (oldTask.assigneeId !== assigneeId) changeMsg += ` Assigned to ${assigneeName}.`;

        await updateDoc(taskRef, {
          title, description, priority, status, assigneeId, dueDate
        });
        
        logActivity("update", changeMsg);
      } else {
        // Create Task
        await addDoc(collection(db, "tasks"), {
          title, description, priority, status, assigneeId, dueDate,
          dateCreated: new Date().toISOString().split("T")[0],
          creatorId: currentUser ? currentUser.uid : null
        });
        
        logActivity("create", `Task "${title}" created and assigned to ${assigneeName}.`);
      }
    } catch (error) {
      console.error("Error saving task: ", error);
      alert("Failed to save task.");
    }

    closeTaskModal();
"""
# We need to slice content. We will replace everything from "function saveTask(e) {" until "  function deleteTask(taskId) {"
start_idx = content.find(save_task_search)
end_idx = content.find("  function deleteTask(taskId) {")

content = content[:start_idx] + save_task_replace + "\n" + content[end_idx:]

# 2. Replace deleteTask
delete_task_search = "  function deleteTask(taskId) {"
delete_task_replace = """  async function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (confirm(`Delete the task: "${task.title}"?`)) {
      try {
        await deleteDoc(doc(db, "tasks", taskId));
        logActivity("update", `Task "${task.title}" deleted.`);
      } catch (error) {
        console.error("Error deleting task: ", error);
      }
    }
  }
"""
start_idx = content.find("  function deleteTask(taskId) {")
end_idx = content.find("  // ================= TEAM CRUD OPERATIONS =================")

content = content[:start_idx] + delete_task_replace + "\n" + content[end_idx:]

with open(app_js_path, "w") as f:
    f.write(content)

print("CRUD refactored.")
