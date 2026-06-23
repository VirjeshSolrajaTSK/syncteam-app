// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAebNRwui6s4wXO0mCWpMIc8S8aKJ2SrRg",
  authDomain: "jiraclone-418be.firebaseapp.com",
  projectId: "jiraclone-418be",
  storageBucket: "jiraclone-418be.firebasestorage.app",
  messagingSenderId: "664494802700",
  appId: "1:664494802700:web:9368f6193083e0be6aeb29",
  measurementId: "G-MJPGR4ZFEE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export instances to be used in app.js
export { app, auth, db, RecaptchaVerifier, signInWithPhoneNumber, collection, addDoc, onSnapshot, query, where, orderBy };
