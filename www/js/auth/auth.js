import { auth, db, RecaptchaVerifier, signInWithPhoneNumber, doc, setDoc, getDoc, collection, addDoc } from '../services/firebase.js';

let confirmationResult = null;
let currentAppUser = null; // Stores our custom user document

export function initAuth(onAuthStateChangedCallback) {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Fetch our custom user doc from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                currentAppUser = { uid: user.uid, ...userDoc.data() };
            } else {
                // Should not normally happen if they just signed up, but just in case
                currentAppUser = { uid: user.uid, phone: user.phoneNumber, role: "Employee" };
            }
        } else {
            currentAppUser = null;
        }
        onAuthStateChangedCallback(currentAppUser);
    });
}

export function getCurrentUser() {
    return currentAppUser;
}

export function setupRecaptcha(containerId) {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            'size': 'normal',
            'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
        window.recaptchaVerifier.render();
    }
}

export async function sendOTP(phoneNumber) {
    const appVerifier = window.recaptchaVerifier;
    try {
        confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        return true;
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function verifyOTPAndLogin(code, name, email) {
    if (!confirmationResult) throw new Error("No OTP request found.");
    try {
        const result = await confirmationResult.confirm(code);
        const user = result.user;
        
        // Check if user exists in our DB
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            // New user registration
            // Create a default organization for them as owner MVP
            const orgRef = await addDoc(collection(db, "organizations"), {
                name: `${name || 'Default'}'s Organization`,
                createdAt: new Date().toISOString()
            });

            const newUser = {
                uid: user.uid,
                name: name || user.phoneNumber,
                phone: user.phoneNumber,
                email: email || "",
                role: "Owner",
                organizationId: orgRef.id,
                active: true,
                createdAt: new Date().toISOString()
            };
            
            await setDoc(userRef, newUser);
            currentAppUser = newUser;
        } else {
            currentAppUser = { uid: user.uid, ...userSnap.data() };
        }
        return currentAppUser;
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function logoutUser() {
    await auth.signOut();
    currentAppUser = null;
}
