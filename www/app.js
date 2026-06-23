// Firebase Integration Imports
import { app, auth, db, RecaptchaVerifier, signInWithPhoneNumber, collection, addDoc, onSnapshot, query, where, orderBy } from './firebase-config.js';
import { doc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// SyncTeam Mobile - Main Application Logic
// Stored on window or declared globally to support direct file:// protocol usage.

document.addEventListener("DOMContentLoaded", () => {
  // ================= STATE CONFIGURATION =================
  let currentUser = null;
  let confirmationResult = null;

  let team = [];
  let tasks = [];
  let systemLogs = [];
  
  // Active state trackers
  let activeTab = "dashboard";
  let activeInquiryTaskId = null;
  let activeInquiryChannel = "slack";
  let typingTimeoutId = null;

  // ================= FIREBASE AUTH & DATA =================
  function initData() {
    // Listen for Auth State
    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUser = user;
        document.getElementById('login-overlay').classList.add('hidden');
        setupRealtimeListeners();
      } else {
        currentUser = null;
        document.getElementById('login-overlay').classList.remove('hidden');
        setupRecaptcha();
      }
    });
  }

  function setupRecaptcha() {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': (response) => {
          // reCAPTCHA solved
        }
      });
      window.recaptchaVerifier.render();
    }
  }

  function setupRealtimeListeners() {
    if (!currentUser) return;
    
    // Listen to Team Members
    onSnapshot(collection(db, "users"), (snapshot) => {
      team = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderTeam();
    });

    // Listen to Tasks
    onSnapshot(collection(db, "tasks"), (snapshot) => {
      tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderTasks();
      renderDashboard();
    });

    // Listen to System Logs (using a central logs collection for now)
    const logsQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    onSnapshot(logsQuery, (snapshot) => {
      systemLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderActivityLog();
    });
  }

  // Auth Event Listeners
  document.getElementById('btn-send-otp').addEventListener('click', () => {
    const phoneNumber = document.getElementById('phone-number').value;
    const appVerifier = window.recaptchaVerifier;
    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      .then((confResult) => {
        confirmationResult = confResult;
        document.getElementById('step-phone').classList.remove('active');
        document.getElementById('step-phone').classList.add('hidden');
        document.getElementById('step-otp').classList.remove('hidden');
        document.getElementById('step-otp').classList.add('active');
      }).catch((error) => {
        alert("Error sending OTP: " + error.message);
      });
  });

  document.getElementById('btn-verify-otp').addEventListener('click', () => {
    const code = document.getElementById('otp-code').value;
    confirmationResult.confirm(code).then((result) => {
      // User signed in successfully
      // Save user profile if new
      setDoc(doc(db, "users", result.user.uid), {
        phoneNumber: result.user.phoneNumber,
        name: result.user.phoneNumber, // Default name to phone
        role: "Team Member"
      }, { merge: true });
    }).catch((error) => {
      alert("Invalid OTP: " + error.message);
    });
  });

  document.getElementById('btn-back-phone').addEventListener('click', () => {
    document.getElementById('step-otp').classList.remove('active');
    document.getElementById('step-otp').classList.add('hidden');
    document.getElementById('step-phone').classList.remove('hidden');
    document.getElementById('step-phone').classList.add('active');
  });

  async function logActivity(type, message) {
    await addDoc(collection(db, "logs"), {
      timestamp: new Date().toISOString(),
      type,
      message,
      userId: currentUser ? currentUser.uid : null
    });
  }
  // ================= DOM ELEMENT CACHE =================
  const elements = {
    // Navigation & OS Status Clock
    navItems: document.querySelectorAll(".bottom-nav-item"),
    panels: document.querySelectorAll(".content-panel"),
    statusClock: document.getElementById("status-clock"),
    globalSearch: document.getElementById("global-search"),
    btnQuickTask: document.getElementById("btn-quick-task"),
    linkViewAllActivity: document.getElementById("link-view-all-activity"),

    // Dashboard
    metricTodo: document.getElementById("metric-todo"),
    metricProgress: document.getElementById("metric-progress"),
    metricBlocked: document.getElementById("metric-blocked"),
    metricDone: document.getElementById("metric-done"),
    workloadContainer: document.getElementById("workload-container"),
    recentInquiriesContainer: document.getElementById("recent-inquiries-container"),

    // Tasks Board
    filterStatus: document.getElementById("filter-status"),
    filterPriority: document.getElementById("filter-priority"),
    filterAssignee: document.getElementById("filter-assignee"),
    tasksContainer: document.getElementById("tasks-container"),
    btnAddTask: document.getElementById("btn-add-task"),

    // Team Directory
    teamContainer: document.getElementById("team-container"),
    btnAddMember: document.getElementById("btn-add-member"),

    // Activity Log
    logContainer: document.getElementById("log-container"),
    btnClearLogs: document.getElementById("btn-clear-logs"),

    // Mobile Sheet Modals
    modalTask: document.getElementById("modal-task"),
    taskForm: document.getElementById("task-form"),
    taskModalTitle: document.getElementById("task-modal-title"),
    taskIdInput: document.getElementById("task-id"),
    taskTitleInput: document.getElementById("task-title"),
    taskDescInput: document.getElementById("task-description"),
    taskPriorityInput: document.getElementById("task-priority"),
    taskStatusInput: document.getElementById("task-status"),
    taskAssigneeSelect: document.getElementById("task-assignee"),
    taskDueDateInput: document.getElementById("task-due-date"),
    btnCancelTask: document.getElementById("btn-cancel-task"),
    btnCloseTaskModal: document.getElementById("btn-close-task-modal"),

    modalMember: document.getElementById("modal-member"),
    memberForm: document.getElementById("member-form"),
    btnCancelMember: document.getElementById("btn-cancel-member"),
    btnCloseMemberModal: document.getElementById("btn-close-member-modal"),

    // Fullscreen Inquiry Chat
    modalInquiry: document.querySelector(".fullscreen-chat-page"),
    inquiryTaskTitle: document.querySelector(".banner-task-name"),
    inquiryRecipientAvatar: document.getElementById("inquiry-recipient-avatar"),
    inquiryRecipientName: document.getElementById("inquiry-recipient-name"),
    inquiryRecipientRole: document.getElementById("inquiry-recipient-role"),
    inquiryDraft: document.getElementById("inquiry-draft"),
    btnSendInquiry: document.getElementById("btn-send-inquiry"),
    chatMessages: document.getElementById("chat-messages"),
    chatTypingContainer: document.getElementById("chat-typing-container"),
    chatActions: document.getElementById("chat-actions"),
    btnApplyLogReply: document.getElementById("btn-apply-log-reply"),
    btnApplyStatusUpdate: document.getElementById("btn-apply-status-update"),
    btnCloseInquiryModal: document.getElementById("btn-close-inquiry-modal"),
    channelBtns: document.querySelectorAll(".channel-tab-btn"),
    activeChannelIcon: document.getElementById("active-channel-icon"),
    activeChannelName: document.getElementById("active-channel-name")
  };

  // ================= GENERAL HELPERS =================
  
  // Real-time Mobile Clock (format hh:mm)
  function startClock() {
    const updateClock = () => {
      const now = new Date();
      elements.statusClock.textContent = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Get Initials for Avatar
  function getInitials(name) {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  // Find Team Member by ID
  function getMember(id) {
    return team.find(m => m.id === id);
  }

  // System Time string generator
  function getFormattedTimestamp(isoString = null) {
    const date = isoString ? new Date(isoString) : new Date();
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Log action to Activity list
  function logActivity(type, message) {
    const newLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      message
    };
    systemLogs.unshift(newLog);
    if (systemLogs.length > 100) systemLogs.pop();
    saveState("sync_system_logs", systemLogs);
    renderActivityLog();
    renderDashboard();
  }

  // ================= NAVIGATION =================
  function setupNavigation() {
    elements.navItems.forEach(item => {
      item.addEventListener("click", e => {
        e.preventDefault();
        const tab = item.getAttribute("data-tab");
        switchTab(tab);
      });
    });

    if (elements.linkViewAllActivity) {
      elements.linkViewAllActivity.addEventListener("click", e => {
        e.preventDefault();
        switchTab("activity");
      });
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    
    // Toggle active navigation class
    elements.navItems.forEach(item => {
      if (item.getAttribute("data-tab") === tab) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Toggle active panel class
    elements.panels.forEach(panel => {
      if (panel.id === `panel-${tab}`) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });

    // Trigger panel renders
    if (tab === "dashboard") {
      renderDashboard();
    } else if (tab === "tasks") {
      renderTasks();
    } else if (tab === "team") {
      renderTeam();
    } else if (tab === "activity") {
      renderActivityLog();
    }

    lucide.createIcons();
  }

  // ================= DASHBOARD RENDERING =================
  function renderDashboard() {
    // 1. Calculate Metrics
    const todoCount = tasks.filter(t => t.status === "todo").length;
    const progressCount = tasks.filter(t => t.status === "in_progress").length;
    const blockedCount = tasks.filter(t => t.status === "blocked").length;
    const doneCount = tasks.filter(t => t.status === "done").length;

    elements.metricTodo.textContent = todoCount;
    elements.metricProgress.textContent = progressCount;
    elements.metricBlocked.textContent = blockedCount;
    elements.metricDone.textContent = doneCount;

    // 2. Render Team Workloads
    elements.workloadContainer.innerHTML = "";
    
    const activeTasksByMember = {};
    team.forEach(member => {
      activeTasksByMember[member.id] = tasks.filter(
        t => t.assigneeId === member.id && t.status !== "done"
      ).length;
    });

    const sortedTeam = [...team].sort((a, b) => {
      return (activeTasksByMember[b.id] || 0) - (activeTasksByMember[a.id] || 0);
    });

    sortedTeam.forEach(member => {
      const activeCount = activeTasksByMember[member.id] || 0;
      const fillPercentage = Math.min((activeCount / 5) * 100, 100);
      
      let barColor = "var(--color-done)";
      if (activeCount >= 4) {
        barColor = "var(--color-blocked)";
      } else if (activeCount >= 2) {
        barColor = "var(--priority-high)";
      }

      const workloadItem = document.createElement("div");
      workloadItem.className = "workload-item";
      workloadItem.innerHTML = `
        <div class="workload-member-info">
          <div class="avatar" style="background-color: ${member.avatarColor}">
            ${getInitials(member.name)}
          </div>
          <div>
            <strong style="font-size: 0.8rem;">${member.name}</strong>
            <p style="font-size: 0.65rem; color: var(--text-muted)">${member.role}</p>
          </div>
        </div>
        <div class="workload-bar-wrapper">
          <div class="workload-bar-bg">
            <div class="workload-bar-fill" style="width: ${fillPercentage}%; background-color: ${barColor}"></div>
          </div>
        </div>
        <div class="workload-count">
          <strong>${activeCount}</strong> ticket${activeCount !== 1 ? 's' : ''}
        </div>
      `;
      elements.workloadContainer.appendChild(workloadItem);
    });

    // 3. Recent Status Inquiries
    elements.recentInquiriesContainer.innerHTML = "";
    const inquiryLogs = systemLogs
      .filter(log => log.type === "inquiry" || log.type === "response")
      .slice(0, 3); // Fit exactly 3 in mobile view

    if (inquiryLogs.length === 0) {
      elements.recentInquiriesContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 16px; font-size: 0.75rem;">
          No status inquiries logged.
        </div>
      `;
    } else {
      inquiryLogs.forEach(log => {
        const item = document.createElement("div");
        item.className = `timeline-item ${log.type === "inquiry" ? "inquiry" : "response"}`;
        
        if (log.message.includes("Blocked")) {
          item.classList.add("blocked");
        }

        item.innerHTML = `
          <div class="timeline-meta">
            <span class="timeline-author">${log.type === "inquiry" ? "Request" : "Response"}</span>
            <span class="timeline-time">${getFormattedTimestamp(log.timestamp)}</span>
          </div>
          <div class="timeline-content">
            <span>${log.type === "inquiry" ? "Sent" : "Received"}</span>
            ${log.message.substring(0, 90)}${log.message.length > 90 ? '...' : ''}
          </div>
        `;
        elements.recentInquiriesContainer.appendChild(item);
      });
    }
  }

  // ================= TASKS BOARD RENDERING =================
  function renderTasks() {
    // 1. Populate Assignee Filter Dropdown Dynamically
    const prevSelectedAssignee = elements.filterAssignee.value;
    elements.filterAssignee.innerHTML = `
      <option value="all">Everyone</option>
      <option value="unassigned">Unassigned</option>
    `;
    team.forEach(member => {
      const opt = document.createElement("option");
      opt.value = member.id;
      opt.textContent = member.name;
      elements.filterAssignee.appendChild(opt);
    });
    elements.filterAssignee.value = prevSelectedAssignee || "all";

    // 2. Populate Task Form Assignee Select
    elements.taskAssigneeSelect.innerHTML = `<option value="">Team (Unassigned)</option>`;
    team.forEach(member => {
      const opt = document.createElement("option");
      opt.value = member.id;
      opt.textContent = `${member.name} (${member.role.substring(0, 18)})`;
      elements.taskAssigneeSelect.appendChild(opt);
    });

    // 3. Filter Tasks
    const statusFilter = elements.filterStatus.value;
    const priorityFilter = elements.filterPriority.value;
    const assigneeFilter = elements.filterAssignee.value;
    const searchQuery = elements.globalSearch.value.trim().toLowerCase();

    let filtered = tasks.filter(task => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (assigneeFilter !== "all") {
        if (assigneeFilter === "unassigned" && task.assigneeId) return false;
        if (assigneeFilter !== "unassigned" && task.assigneeId !== assigneeFilter) return false;
      }
      if (searchQuery) {
        const titleMatch = task.title.toLowerCase().includes(searchQuery);
        const descMatch = task.description && task.description.toLowerCase().includes(searchQuery);
        let assigneeMatch = false;
        if (task.assigneeId) {
          const m = getMember(task.assigneeId);
          if (m) {
            assigneeMatch = m.name.toLowerCase().includes(searchQuery);
          }
        }
        return titleMatch || descMatch || assigneeMatch;
      }
      return true;
    });

    // Render Cards in Single Column Feed
    elements.tasksContainer.innerHTML = "";
    
    if (filtered.length === 0) {
      elements.tasksContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 32px 0;">
          <i data-lucide="folder-open" style="width: 36px; height: 36px; margin-bottom: 8px; opacity: 0.4;"></i>
          <p style="font-size: 0.8rem;">No tasks found.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    filtered.forEach(task => {
      const card = document.createElement("div");
      card.className = `task-card status-${task.status}`;
      
      const assignee = task.assigneeId ? getMember(task.assigneeId) : null;
      const avatarHTML = assignee
        ? `<div class="avatar" style="background-color: ${assignee.avatarColor}" title="${assignee.name}">${getInitials(assignee.name)}</div>`
        : `<div class="avatar" style="background-color: var(--text-muted);" title="Team Task"><i data-lucide="users" style="width: 10px; height: 10px;"></i></div>`;
      
      const assigneeName = assignee ? assignee.name : "Entire Team";
      
      const todayStr = new Date().toISOString().split("T")[0];
      const isOverdue = task.dueDate < todayStr && task.status !== "done";
      const dueLabel = isOverdue ? "OVERDUE" : "DUE";
      const dueColor = isOverdue ? "var(--color-blocked)" : "var(--text-secondary)";

      card.innerHTML = `
        <div class="task-card-header">
          <div class="task-badges">
            <span class="badge badge-status-${task.status}">${task.status.replace("_", " ")}</span>
            <span class="badge badge-priority-${task.priority}">${task.priority}</span>
          </div>
          
          <div class="task-actions-menu">
            <button class="btn-task-action" data-task-id="${task.id}">
              <i data-lucide="more-horizontal" style="width: 16px; height: 16px;"></i>
            </button>
            <div class="task-dropdown" id="dropdown-${task.id}">
              <button class="task-dropdown-item edit-task-btn" data-task-id="${task.id}">
                <i data-lucide="edit-3" style="width: 11px; height: 11px;"></i> Edit
              </button>
              <button class="task-dropdown-item delete-item delete-task-btn" data-task-id="${task.id}">
                <i data-lucide="trash-2" style="width: 11px; height: 11px;"></i> Delete
              </button>
            </div>
          </div>
        </div>

        <h4 class="task-title">${task.title}</h4>
        <p class="task-description">${task.description || "No description."}</p>

        <div class="task-card-footer">
          <div class="task-assignee-info">
            ${avatarHTML}
            <div class="assignee-details">
              <strong>${assigneeName}</strong>
            </div>
          </div>
          
          <div class="task-deadline">
            <span style="color: ${dueColor}">${dueLabel}</span>
            <strong style="color: ${isOverdue ? 'var(--color-blocked)' : 'inherit'}">${task.dueDate}</strong>
          </div>
        </div>

        <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
          <button class="btn-ask-status" data-task-id="${task.id}">
            <i data-lucide="message-square"></i> Ask Status
          </button>
        </div>
      `;

      elements.tasksContainer.appendChild(card);
    });

    lucide.createIcons();
    setupTaskCardEvents();
  }

  // Event handlers inside Task Cards
  function setupTaskCardEvents() {
    // 1. Toggling the options dropdown
    document.querySelectorAll(".btn-task-action").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const taskId = btn.getAttribute("data-task-id");
        document.querySelectorAll(".task-dropdown").forEach(d => {
          if (d.id !== `dropdown-${taskId}`) d.classList.remove("show");
        });
        document.getElementById(`dropdown-${taskId}`).classList.toggle("show");
      });
    });

    // Close dropdowns on body click
    document.body.addEventListener("click", () => {
      document.querySelectorAll(".task-dropdown").forEach(d => d.classList.remove("show"));
    });

    // 2. Edit Task Click
    document.querySelectorAll(".edit-task-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const taskId = btn.getAttribute("data-task-id");
        openTaskModal(taskId);
      });
    });

    // 3. Delete Task Click
    document.querySelectorAll(".delete-task-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const taskId = btn.getAttribute("data-task-id");
        deleteTask(taskId);
      });
    });

    // 4. Ask Status Click
    document.querySelectorAll(".btn-ask-status").forEach(btn => {
      btn.addEventListener("click", e => {
        const taskId = btn.getAttribute("data-task-id");
        openInquiryModal(taskId);
      });
    });
  }

  // ================= TEAM PANEL RENDERING =================
  function renderTeam() {
    elements.teamContainer.innerHTML = "";

    team.forEach(member => {
      const memberTasks = tasks.filter(t => t.assigneeId === member.id);
      const activeCount = memberTasks.filter(t => t.status !== "done").length;
      const completedCount = memberTasks.filter(t => t.status === "done").length;

      const card = document.createElement("div");
      card.className = "member-card";
      
      const presenceClass = member.status === "active" ? "active" : (member.status === "away" ? "away" : "offline");
      const presenceText = member.status.charAt(0).toUpperCase() + member.status.slice(1);

      card.innerHTML = `
        <div class="avatar-lg" style="background-color: ${member.avatarColor}">
          ${getInitials(member.name)}
        </div>

        <div class="member-details-wrapper">
          <div class="member-presence">
            <span class="presence-dot ${presenceClass}"></span>
            <span>${presenceText}</span>
          </div>
          <h3 class="member-name">${member.name}</h3>
          <p class="member-role">${member.role}</p>
          
          <div class="member-sub-info">
            <span>Tasks: <strong>${activeCount} active</strong></span>
            <span>Finished: <strong>${completedCount}</strong></span>
            <span>Timezone: <strong>${member.timezone}</strong></span>
          </div>
        </div>

        <button class="btn-remove-member" data-member-id="${member.id}" title="Remove Member">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
        </button>
      `;

      elements.teamContainer.appendChild(card);
    });

    document.querySelectorAll(".btn-remove-member").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-member-id");
        deleteMember(id);
      });
    });

    lucide.createIcons();
  }

  // ================= ACTIVITY LOG RENDERING =================
  function renderActivityLog() {
    elements.logContainer.innerHTML = "";
    
    if (systemLogs.length === 0) {
      elements.logContainer.innerHTML = `
        <li style="text-align: center; color: var(--text-muted); padding: 24px; font-size: 0.8rem;">
          No events logged.
        </li>
      `;
      return;
    }

    systemLogs.forEach(log => {
      const li = document.createElement("li");
      li.className = "log-item";

      let iconType = "update";
      let lucideIcon = "refresh-cw";

      if (log.type === "create") {
        iconType = "create";
        lucideIcon = "plus";
      } else if (log.type === "inquiry") {
        iconType = "inquiry";
        lucideIcon = "send";
      } else if (log.type === "response") {
        iconType = "response";
        lucideIcon = "message-circle";
      }

      li.innerHTML = `
        <div class="log-item-icon type-${iconType}">
          <i data-lucide="${lucideIcon}"></i>
        </div>
        <div class="log-item-content">
          ${log.message}
        </div>
        <div class="log-item-time">
          ${getFormattedTimestamp(log.timestamp)}
        </div>
      `;
      elements.logContainer.appendChild(li);
    });

    lucide.createIcons();
  }

  // ================= TASK CRUD OPERATIONS =================
  function openTaskModal(taskId = null) {
    elements.taskForm.reset();
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    elements.taskDueDateInput.value = nextWeek.toISOString().split("T")[0];

    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        elements.taskModalTitle.textContent = "Edit Task Details";
        elements.taskIdInput.value = task.id;
        elements.taskTitleInput.value = task.title;
        elements.taskDescInput.value = task.description || "";
        elements.taskPriorityInput.value = task.priority;
        elements.taskStatusInput.value = task.status;
        elements.taskAssigneeSelect.value = task.assigneeId || "";
        elements.taskDueDateInput.value = task.dueDate;
      }
    } else {
      elements.taskModalTitle.textContent = "Create Task";
      elements.taskIdInput.value = "";
      elements.taskStatusInput.value = "todo";
    }

    elements.modalTask.classList.add("show");
  }

  function closeTaskModal() {
    elements.modalTask.classList.remove("show");
  }

  async function saveTask(e) {
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

  async function deleteTask(taskId) {
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

  // ================= TEAM CRUD OPERATIONS =================
  function openMemberModal() {
    elements.memberForm.reset();
    elements.modalMember.classList.add("show");
  }

  function closeMemberModal() {
    elements.modalMember.classList.remove("show");
  }

  async function saveMember(e) {
    e.preventDefault();
    const name = document.getElementById("member-name").value.trim();
    const role = document.getElementById("member-role").value.trim();
    const email = document.getElementById("member-email").value.trim();

    try {
      await addDoc(collection(db, "users"), {
        name, role, email,
        avatarColor: "#" + Math.floor(Math.random()*16777215).toString(16),
        status: "online"
      });
      logActivity("create", `Team member "${name}" added.`);
    } catch (error) {
      console.error("Error adding member: ", error);
    }

    closeMemberModal();
  }

  async function deleteMember(memberId) {
    const member = team.find(m => m.id === memberId);
    if (!member) return;
    
    if (confirm(`Remove team member: "${member.name}"?`)) {
      try {
        await deleteDoc(doc(db, "users", memberId));
        logActivity("update", `Team member "${member.name}" removed.`);
      } catch (error) {
        console.error("Error removing member:", error);
      }
    }
  }

  elements.btnSendInquiry.addEventListener("click", async () => {
    if (!activeInquiryTaskId) return;
    const msg = elements.inquiryDraft.value.trim();
    if (!msg) return;

    elements.inquiryDraft.value = "";

    try {
      await addDoc(collection(db, "messages"), {
        taskId: activeInquiryTaskId,
        senderId: currentUser ? currentUser.uid : "user",
        senderName: currentUser && currentUser.phoneNumber ? currentUser.phoneNumber : "Me",
        content: msg,
        timestamp: new Date().toISOString()
      });
      // The onSnapshot listener will handle rendering
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  });

  // Global listener for messages to handle Local Notifications
  let isFirstLoadMessages = true;
  onSnapshot(query(collection(db, "messages"), orderBy("timestamp", "asc")), async (snapshot) => {
    const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Check for new incoming messages for local notifications
    if (!isFirstLoadMessages && snapshot.docChanges().length > 0) {
      for (const change of snapshot.docChanges()) {
        if (change.type === "added") {
          const msg = change.doc.data();
          if (msg.senderId !== (currentUser ? currentUser.uid : "user")) {
            // Trigger Local Notification
            if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
              await window.Capacitor.Plugins.LocalNotifications.schedule({
                notifications: [{
                  title: "New Status Update",
                  body: `${msg.senderName}: ${msg.content}`,
                  id: new Date().getTime(),
                  schedule: { at: new Date(Date.now() + 1000) }
                }]
              });
            } else if ("Notification" in window && Notification.permission === "granted") {
              new Notification("New Status Update", { body: `${msg.senderName}: ${msg.content}` });
            }
          }
        }
      }
    }
    isFirstLoadMessages = false;

    // Render if chat is open
    if (activeInquiryTaskId) {
      const taskMessages = allMessages.filter(m => m.taskId === activeInquiryTaskId);
      
      elements.chatMessages.innerHTML = "";
      taskMessages.forEach(msg => {
        const isMe = msg.senderId === (currentUser ? currentUser.uid : "user");
        const msgDiv = document.createElement("div");
        msgDiv.className = `chat-message ${isMe ? 'message-sent' : 'message-received'}`;
        msgDiv.innerHTML = `
          <div class="message-bubble">${msg.content}</div>
          <div class="message-meta">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        `;
        elements.chatMessages.appendChild(msgDiv);
      });
      elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
  });


