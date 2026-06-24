import { db, collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy } from './firebase.js';
import { logActivity } from './activityService.js';

export function listenToOrganizationTasks(organizationId, callback) {
    if (!organizationId) return () => {};
    
    const q = query(
        collection(db, "tasks"),
        where("organizationId", "==", organizationId),
        orderBy("createdAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
        try {
            if (snapshot.empty) {
                callback([]);
            } else {
                const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(tasks);
            }
        } catch (err) {
            console.error("Task listener error:", err);
            callback([]);
        }
    });
}

export async function createNewTask(taskData, currentUser) {
    try {
        const newTask = {
            ...taskData,
            status: "Open",
            assignedBy: currentUser.uid,
            organizationId: currentUser.organizationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "tasks"), newTask);
        
        // Log Activity
        await logActivity(docRef.id, currentUser.uid, "Created task", `Task created and assigned to ${taskData.assignedToName || 'someone'}`);
        return docRef.id;
    } catch (error) {
        throw new Error("Failed to create task: " + error.message);
    }
}

export async function updateTaskStatus(taskId, newStatus, currentUser) {
    try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
        
        // Log Activity
        await logActivity(taskId, currentUser.uid, "Updated status", `Changed status to ${newStatus}`);
        return true;
    } catch (error) {
        throw new Error("Failed to update status: " + error.message);
    }
}
