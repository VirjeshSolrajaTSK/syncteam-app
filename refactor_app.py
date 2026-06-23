import os

app_js_path = "/Users/virjeshsolraja/.gemini/antigravity/scratch/task-tracker-app/www/app.js"

with open(app_js_path, "r") as f:
    content = f.read()

# 1. Inject Firebase imports at the top
firebase_imports = """// Firebase Integration Imports
import { app, auth, db, RecaptchaVerifier, signInWithPhoneNumber, collection, addDoc, onSnapshot, query, where, orderBy } from './firebase-config.js';
import { doc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

"""
content = firebase_imports + content

# 2. Add Login State variables in DOMContentLoaded
state_config_search = "  // ================= STATE CONFIGURATION ================="
state_config_replace = """  // ================= STATE CONFIGURATION =================
  let currentUser = null;
  let confirmationResult = null;
"""
content = content.replace(state_config_search, state_config_replace)

# 3. Replace initData and saveState with Firebase Listeners
init_data_block_start = content.find("  // Initialize data from LocalStorage or Fallbacks")
init_data_block_end = content.find("  // ================= DOM ELEMENT CACHE =================")

firebase_init_code = """  // ================= FIREBASE AUTH & DATA =================
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
"""
content = content[:init_data_block_start] + firebase_init_code + content[init_data_block_end:]

# Write back
with open(app_js_path, "w") as f:
    f.write(content)

print("Successfully injected Auth and Listeners into app.js")
