import { auth, db } from './firebase.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
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

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const authError = document.getElementById('auth-error');

const userEmailDisplay = document.getElementById('user-email-display');
const radhBalanceDisplay = document.getElementById('radh-balance');

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
    const email = emailInput.value;
    const password = passwordInput.value;

    if(!email || !password) {
        showError('Please enter both email and password.');
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // We will handle the document creation inside the onAuthStateChanged listener
        // via loadDashboard to avoid race conditions.
    } catch (error) {
        showError(error.message);
    }
});

// Login
loginBtn.addEventListener('click', async () => {
    clearError();
    const email = emailInput.value;
    const password = passwordInput.value;

    if(!email || !password) {
        showError('Please enter both email and password.');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
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
    userEmailDisplay.textContent = `Operative: ${user.email}`;

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            radhBalanceDisplay.textContent = data.totalRadh !== undefined ? data.totalRadh : 0;

            // Dispatch custom event if wallet.js needs to know user loaded
            window.dispatchEvent(new CustomEvent('userLoaded', { detail: { uid: user.uid, walletAddress: data.walletAddress } }));
        } else {
            // Fallback if doc missing (this happens on first sign up)
            radhBalanceDisplay.textContent = "0";
            // Create doc
            await setDoc(userDocRef, { totalRadh: 0, createdAt: new Date().toISOString() });
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
        emailInput.value = '';
        passwordInput.value = '';
        radhBalanceDisplay.textContent = '...';
        clearError();

        // Dispatch event for wallet reset
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }
});
