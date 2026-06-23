import os

app_js_path = "/Users/virjeshsolraja/.gemini/antigravity/scratch/task-tracker-app/www/app.js"

with open(app_js_path, "r") as f:
    content = f.read()

# Replace send inquiry
send_inquiry_search = "  elements.btnSendInquiry.addEventListener(\"click\", () => {"
send_inquiry_replace = """  elements.btnSendInquiry.addEventListener("click", async () => {
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
"""

start_idx = content.find("  elements.btnSendInquiry.addEventListener(\"click\", () => {")
end_idx = content.find("    // Simulate typing delay")

content = content[:start_idx] + send_inquiry_replace + "\n" + content[end_idx:]

with open(app_js_path, "w") as f:
    f.write(content)

print("Messaging refactored.")
