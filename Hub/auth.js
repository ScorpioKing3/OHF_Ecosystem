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

const usernameContainer = document.getElementById('username-container');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authForm = document.getElementById('auth-form');
const actionBtn = document.getElementById('action-btn');
const toggleAuthModeBtn = document.getElementById('toggle-auth-mode');
const guestBtn = document.getElementById('guest-btn');
const logoutBtn = document.getElementById('logout-btn');
const authError = document.getElementById('auth-error');

const userEmailDisplay = document.getElementById('user-email-display');
const radhBalanceDisplay = document.getElementById('radh-balance');

// Store original username temporarily during signup to handle race condition
let pendingUsername = null;


// Auth Mode State (login or signup)
let authMode = 'login'; // 'login' or 'signup'

toggleAuthModeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    clearError();
    if (authMode === 'login') {
        authMode = 'signup';
        usernameContainer.classList.remove('hidden');
        actionBtn.textContent = 'SIGN UP';
        actionBtn.className = 'w-full py-3 rounded-md font-orbitron font-bold text-lg neon-btn-purple';
        toggleAuthModeBtn.textContent = 'Already have an account? Log In';
    } else {
        authMode = 'login';
        usernameContainer.classList.add('hidden');
        actionBtn.textContent = 'LOGIN';
        actionBtn.className = 'w-full py-3 rounded-md font-orbitron font-bold text-lg neon-btn-blue';
        toggleAuthModeBtn.textContent = 'Need an account? Sign Up';
    }
});

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

// Auth Form Submit (Login or Sign Up)
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('Please enter both email and password.');
        return;
    }

    if (authMode === 'signup') {
        const username = usernameInput.value.trim();
        if (!username) {
            showError('Please enter a username for sign up.');
            return;
        }
        pendingUsername = username;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            showError(error.message);
            pendingUsername = null;
        }
    } else {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            showError(error.message);
        }
    }
});

// Play as Guest
guestBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent any default action just in case
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
            const displayUsername = data.username || (user.isAnonymous ? "New OHF Agent!" : "Operative");
            userEmailDisplay.textContent = `Welcome, ${displayUsername}!`;
            radhBalanceDisplay.textContent = data.totalRadh !== undefined ? data.totalRadh : 0;

            // Dispatch custom event if wallet.js needs to know user loaded
            window.dispatchEvent(new CustomEvent('userLoaded', { detail: { uid: user.uid, walletAddress: data.walletAddress } }));
        } else {
            // First time logic (Sign up or new Guest)
            const newUsername = pendingUsername || (user.isAnonymous ? "New OHF Agent!" : "Operative");
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
        emailInput.value = '';
        passwordInput.value = '';
        radhBalanceDisplay.textContent = '...';
        clearError();
        pendingUsername = null;

        // Dispatch event for wallet reset
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }
});
