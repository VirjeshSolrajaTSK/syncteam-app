import { initAuth, logoutUser } from './js/auth/auth.js';
import { listenToOrganizationTasks, createNewTask, updateTaskStatus } from './js/services/taskService.js';
import { listenToAllActivities } from './js/services/activityService.js';
import { initLoginScreen } from './js/screens/loginScreen.js';
import { renderDashboard } from './js/screens/dashboardScreen.js';
import { renderTasksList, openTaskDetails } from './js/screens/tasksScreen.js';
import { renderActivityTimeline } from './js/screens/activityScreen.js';
import { db, collection, getDocs, query, where } from './js/services/firebase.js';

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const bootScreen = document.getElementById('app-boot-screen');
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    // State
    let currentUser = null;
    let allTasks = [];
    let allActivities = [];
    let teamMembers = [];
    let currentTaskFilter = 'all';

    // 1. Initialize Auth
    initAuth((user) => {
        bootScreen.classList.remove('active');
        if (user) {
            currentUser = user;
            loginScreen.style.display = 'none';
            mainApp.style.display = 'flex';
            setupApp();
        } else {
            loginScreen.style.display = 'flex';
            mainApp.style.display = 'none';
        }
    });

    // 2. Setup Login Screen Handlers
    initLoginScreen((user) => {
        currentUser = user;
        loginScreen.style.display = 'none';
        mainApp.style.display = 'flex';
        setupApp();
    });

    // 3. Setup Main App Data
    function setupApp() {
        populateProfileView();
        
        // Listen to Tasks for the user's organization
        listenToOrganizationTasks(currentUser.organizationId, (tasks) => {
            allTasks = tasks;
            refreshUI();
        });

        // Listen to Activities
        listenToAllActivities((activities) => {
            allActivities = activities;
            refreshUI();
        });

        // Fetch team members for assignments
        fetchTeamMembers();
    }

    async function fetchTeamMembers() {
        const q = query(collection(db, "users"), where("organizationId", "==", currentUser.organizationId));
        const snap = await getDocs(q);
        teamMembers = snap.docs.map(d => ({id: d.id, ...d.data()}));
    }

    // 4. UI Refresh Loop
    function refreshUI() {
        renderDashboard(currentUser, allTasks, allActivities);
        applyTaskFilter(); // re-renders task list
        renderActivityTimeline(allActivities, 'global-activity-timeline');
    }

    // 5. Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const headerTitle = document.getElementById('header-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            
            item.classList.add('active');
            const target = item.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
            
            headerTitle.innerText = item.querySelector('span:last-child').innerText;
        });
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        logoutUser();
    });

    // Profile View
    function populateProfileView() {
        document.getElementById('profile-name').innerText = currentUser.name || 'No Name';
        document.getElementById('profile-role').innerText = currentUser.role || 'Employee';
        document.getElementById('profile-phone').innerText = currentUser.phone || '';
        document.getElementById('profile-org').innerText = `Org: ${currentUser.organizationId}`;
    }

    // 6. Task Management Logic
    const btnCreateTaskHeader = document.getElementById('btn-create-task-header');
    const createTaskScreen = document.getElementById('create-task-screen');
    const btnCloseCreateTask = document.getElementById('btn-close-create-task');
    const btnSaveTask = document.getElementById('btn-save-task');
    const assigneeSelect = document.getElementById('new-task-assignee');

    btnCreateTaskHeader.addEventListener('click', () => {
        if (currentUser.role === 'Employee') {
            alert("Only Managers can create tasks.");
            return;
        }
        // Populate assignees
        assigneeSelect.innerHTML = teamMembers.map(m => `<option value="${m.id}">${m.name} (${m.role})</option>`).join('');
        createTaskScreen.classList.add('active');
    });

    btnCloseCreateTask.addEventListener('click', () => {
        createTaskScreen.classList.remove('active');
    });

    btnSaveTask.addEventListener('click', async () => {
        const title = document.getElementById('new-task-title').value;
        const desc = document.getElementById('new-task-desc').value;
        const priority = document.getElementById('new-task-priority').value;
        const dueDate = document.getElementById('new-task-due').value;
        const assignedTo = assigneeSelect.value;
        
        if (!title) {
            alert("Title is required!");
            return;
        }
        
        btnSaveTask.disabled = true;
        btnSaveTask.innerText = "Creating...";

        const assignedUser = teamMembers.find(m => m.id === assignedTo);

        try {
            await createNewTask({
                title,
                description: desc,
                priority,
                dueDate,
                assignedTo,
                assignedToName: assignedUser ? assignedUser.name : "Unknown"
            }, currentUser);
            
            createTaskScreen.classList.remove('active');
            // reset form
            document.getElementById('new-task-title').value = '';
            document.getElementById('new-task-desc').value = '';
        } catch (err) {
            alert("Failed to create task");
            console.error(err);
        } finally {
            btnSaveTask.disabled = false;
            btnSaveTask.innerText = "Create Task";
        }
    });

    // 7. Task Filtering & Details
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentTaskFilter = chip.getAttribute('data-filter');
            applyTaskFilter();
        });
    });

    function applyTaskFilter() {
        let filteredTasks = allTasks;
        if (currentTaskFilter === 'my-tasks') {
            filteredTasks = allTasks.filter(t => t.assignedTo === currentUser.uid);
        } else if (currentTaskFilter === 'assigned-by-me') {
            filteredTasks = allTasks.filter(t => t.assignedBy === currentUser.uid);
        } else if (currentTaskFilter === 'overdue') {
            filteredTasks = allTasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date());
        }
        
        renderTasksList(filteredTasks, 'all-tasks-list', (task) => {
            openTaskDetails(task, currentUser, handleUpdateStatus);
        });
    }

    async function handleUpdateStatus(taskId, newStatus) {
        try {
            await updateTaskStatus(taskId, newStatus, currentUser);
        } catch (err) {
            alert(err.message);
        }
    }

    document.getElementById('btn-close-task-details').addEventListener('click', () => {
        document.getElementById('task-details-screen').classList.remove('active');
    });
});
