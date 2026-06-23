import os

app_js_path = "/Users/virjeshsolraja/.gemini/antigravity/scratch/task-tracker-app/www/app.js"

with open(app_js_path, "r") as f:
    content = f.read()

# Replace saveMember
save_member_search = "  function saveMember(e) {"
save_member_replace = """  async function saveMember(e) {
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
"""

start_idx = content.find("  function saveMember(e) {")
end_idx = content.find("  function deleteMember(memberId) {")

content = content[:start_idx] + save_member_replace + "\n" + content[end_idx:]

delete_member_replace = """  async function deleteMember(memberId) {
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
"""

start_idx = content.find("  function deleteMember(memberId) {")
end_idx = content.find("  // ================= ACTIVITY LOG =================")

content = content[:start_idx] + delete_member_replace + "\n" + content[end_idx:]

with open(app_js_path, "w") as f:
    f.write(content)

print("Members CRUD refactored.")
