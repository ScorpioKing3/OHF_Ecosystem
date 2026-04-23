import { auth, db } from './firebase.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const guestBtn = document.getElementById('guest-btn');
const logoutBtn = document.getElementById('logout-btn');
const authError = document.getElementById('auth-error');

const userEmailDisplay = document.getElementById('user-email-display');
const radhBalanceDisplay = document.getElementById('radh-balance');

// Store original username temporarily during signup to handle race condition
let pendingUsername = null;

// Helper to show errors
function showError(message) {
    authError.textContent = message;
    authError.classList.remove('hidden');
}

// Helper to clear errors
function clearError() {
    authError.textContent = '';
    authError.classList.add('hidden');
}

// Sign Up
signupBtn.addEventListener('click', async () => {
    clearError();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if(!username || !password) {
        showError('Please enter both username and password.');
        return;
    }

    pendingUsername = username;
    const ghostEmail = `${username}@ohf.game`;

    try {
        await createUserWithEmailAndPassword(auth, ghostEmail, password);
    } catch (error) {
        showError(error.message);
        pendingUsername = null;
    }
});

// Login
loginBtn.addEventListener('click', async () => {
    clearError();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if(!username || !password) {
        showError('Please enter both username and password.');
        return;
    }

    const ghostEmail = `${username}@ohf.game`;

    try {
        await signInWithEmailAndPassword(auth, ghostEmail, password);
    } catch (error) {
        showError(error.message);
    }
});

// Play as Guest
guestBtn.addEventListener('click', async () => {
    clearError();
    try {
        await signInAnonymously(auth);
    } catch (error) {
        showError(error.message);
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
    }
});

// Update Dashboard Function
async function loadDashboard(user) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            const displayUsername = data.username || (user.isAnonymous ? "Guest Operative" : "Operative");
            userEmailDisplay.textContent = `Welcome, ${displayUsername}!`;
            radhBalanceDisplay.textContent = data.totalRadh !== undefined ? data.totalRadh : 0;

            // Dispatch custom event if wallet.js needs to know user loaded
            window.dispatchEvent(new CustomEvent('userLoaded', { detail: { uid: user.uid, walletAddress: data.walletAddress } }));
        } else {
            // First time logic (Sign up or new Guest)
            const newUsername = pendingUsername || (user.isAnonymous ? "Guest Operative" : "Operative");
            userEmailDisplay.textContent = `Welcome, ${newUsername}!`;
            radhBalanceDisplay.textContent = "0";

            // Create doc
            await setDoc(userDocRef, {
                username: newUsername,
                totalRadh: 0,
                createdAt: new Date().toISOString()
            });
            pendingUsername = null; // Clear it out

            window.dispatchEvent(new CustomEvent('userLoaded', { detail: { uid: user.uid, walletAddress: null } }));
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        radhBalanceDisplay.textContent = "ERR";
    }
}

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Logged In
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadDashboard(user);
    } else {
        // Logged Out
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');

        // Clear inputs and displays
        usernameInput.value = '';
        passwordInput.value = '';
        radhBalanceDisplay.textContent = '...';
        clearError();
        pendingUsername = null;

        // Dispatch event for wallet reset
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }
});
