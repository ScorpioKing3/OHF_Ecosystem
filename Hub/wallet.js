import { db } from './firebase.js';
import {
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const connectWalletBtn = document.getElementById('connect-wallet-btn');
const manualWalletInput = document.getElementById('manualWalletInput');
const walletStatusDisplay = document.getElementById('wallet-status');

let currentUserUid = null;

// Listen for user loaded event from auth.js
window.addEventListener('userLoaded', (e) => {
    currentUserUid = e.detail.uid;
    const existingWallet = e.detail.walletAddress;

    if (existingWallet) {
        if (walletStatusDisplay) walletStatusDisplay.textContent = `Connected: ${existingWallet.substring(0, 6)}...${existingWallet.substring(existingWallet.length - 4)}`;
        if (walletStatusDisplay) walletStatusDisplay.classList.add('text-green-400');
        if (walletStatusDisplay) walletStatusDisplay.classList.remove('text-gray-400');
        if (connectWalletBtn) connectWalletBtn.textContent = 'UPDATE WALLET';
        if (manualWalletInput) manualWalletInput.value = existingWallet;
    } else {
        resetWalletUI();
    }
});

// Listen for logout event
window.addEventListener('userLoggedOut', () => {
    currentUserUid = null;
    resetWalletUI();
});

function resetWalletUI() {
    if (walletStatusDisplay) walletStatusDisplay.textContent = 'Not Connected';
    if (walletStatusDisplay) walletStatusDisplay.classList.remove('text-green-400');
    if (walletStatusDisplay) walletStatusDisplay.classList.add('text-gray-400');
    if (connectWalletBtn) connectWalletBtn.textContent = 'LINK WALLET';
    if (manualWalletInput) manualWalletInput.value = '';
}

async function linkWallet() {
    if (!currentUserUid) {
        alert("Please ensure you are fully logged in first.");
        return;
    }

    const address = manualWalletInput ? manualWalletInput.value.trim() : "";

    // Validate Ethereum address (starts with 0x and is 42 characters long)
    if (!address.startsWith('0x') || address.length !== 42) {
        alert("Please enter a valid wallet address (must start with '0x' and be 42 characters long).");
        return;
    }

    try {
        // Update UI immediately for responsiveness
        if (walletStatusDisplay) walletStatusDisplay.textContent = `Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        if (walletStatusDisplay) walletStatusDisplay.classList.add('text-green-400');
        if (walletStatusDisplay) walletStatusDisplay.classList.remove('text-gray-400');
        if (connectWalletBtn) connectWalletBtn.textContent = 'UPDATE WALLET';

        // Save to Firestore
        const userDocRef = doc(db, "users", currentUserUid);
        await updateDoc(userDocRef, {
            walletAddress: address
        });

        console.log("Wallet linked and saved to Firestore:", address);

    } catch (error) {
        console.error("Error linking wallet:", error);
        alert("Failed to link wallet. Please try again.");
    }
}

if (connectWalletBtn) connectWalletBtn.addEventListener('click', linkWallet);
