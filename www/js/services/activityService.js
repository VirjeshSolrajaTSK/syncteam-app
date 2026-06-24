import { db, collection, addDoc, onSnapshot, query, orderBy, where } from './firebase.js';

export async function logActivity(taskId, userId, action, message) {
    try {
        await addDoc(collection(db, "activities"), {
            taskId: taskId || "system",
            userId: userId,
            action: action,
            message: message,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
}

// Optional: listen to all activities for a specific org (requires a bit more complex querying or just listening to all and filtering if org ID is embedded)
// For MVP we will just fetch all activities and filter client-side or assume flat structure for now since the schema doesn't put orgId on activities. 
// A better way is to listen to activities where taskId is in the org's task list.
export function listenToAllActivities(callback) {
    const q = query(
        collection(db, "activities"),
        orderBy("createdAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
        try {
            if (snapshot.empty) {
                callback([]);
            } else {
                const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(activities);
            }
        } catch (err) {
            console.error("Activity listener error:", err);
            callback([]);
        }
    });
}
