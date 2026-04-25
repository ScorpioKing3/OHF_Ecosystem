import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// DOM Elements
const radhAmountInput = document.getElementById('radh-amount');
const convertBtn = document.getElementById('convert-btn');
const exchangeMsg = document.getElementById('exchange-msg');
const vendorMsg = document.getElementById('vendor-msg');
const buyCardBtns = document.querySelectorAll('.buy-card-btn');

const hudHam = document.getElementById('hud-ham');
const hudRadh = document.getElementById('hud-radh');

let currentUser = null;

// Helper to show exchange messages
function showExchangeMsg(message, isError = false) {
    if (exchangeMsg) {
        exchangeMsg.textContent = message;
        exchangeMsg.className = `text-center text-sm font-orbitron mt-2 ${isError ? 'text-red-400' : 'text-green-400'}`;
        exchangeMsg.classList.remove('hidden');
        setTimeout(() => {
            exchangeMsg.classList.add('hidden');
        }, 5000);
    }
}

// Helper to show vendor messages
function showVendorMsg(message, isError = false) {
    if (vendorMsg) {
        vendorMsg.textContent = message;
        vendorMsg.className = `text-center text-sm font-orbitron mt-6 ${isError ? 'text-red-400' : 'text-green-400'}`;
        vendorMsg.classList.remove('hidden');
        setTimeout(() => {
            vendorMsg.classList.add('hidden');
        }, 5000);
    }
}

// Ensure the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        currentUser = null;
        // Redirect to hub if not logged in to view market
        window.location.href = 'hub.html';
    }
});

// Exchange Logic
if (convertBtn) {
    convertBtn.addEventListener('click', async () => {
        if (!currentUser) {
            showExchangeMsg("You must be logged in to convert funds.", true);
            return;
        }

        const radhToConvert = parseInt(radhAmountInput.value, 10);

        if (isNaN(radhToConvert) || radhToConvert <= 0) {
            showExchangeMsg("Please enter a valid amount greater than 0.", true);
            return;
        }

        if (radhToConvert % 10 !== 0) {
            showExchangeMsg("Amount must be a multiple of 10.", true);
            return;
        }

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const currentRadh = userData.radhBalance !== undefined ? userData.radhBalance : (userData.totalRadh || 0);
                const currentHam = userData.hamBalance !== undefined ? userData.hamBalance : 0;

                if (currentRadh >= radhToConvert) {
                    const hamToAdd = radhToConvert / 10;
                    const newRadhBalance = currentRadh - radhToConvert;
                    const newHamBalance = currentHam + hamToAdd;

                    await updateDoc(userRef, {
                        radhBalance: newRadhBalance,
                        hamBalance: newHamBalance
                    });

                    // Update HUD immediately
                    if (hudHam) hudHam.textContent = `$HAM: ${newHamBalance}`;
                    if (hudRadh) hudRadh.textContent = `$RADH: ${newRadhBalance}`;

                    radhAmountInput.value = '';
                    showExchangeMsg(`Successfully converted ${radhToConvert} $RADH to ${hamToAdd} $HAM!`, false);

                } else {
                    showExchangeMsg("Insufficient $RADH balance.", true);
                }
            } else {
                showExchangeMsg("User data not found.", true);
            }
        } catch (error) {
            console.error("Exchange Error:", error);
            showExchangeMsg("An error occurred during conversion.", true);
        }
    });
}

// Purchase Logic
buyCardBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        if (!currentUser) {
            showVendorMsg("You must be logged in to purchase items.", true);
            return;
        }

        const cardName = e.target.dataset.card;
        const cost = parseInt(e.target.dataset.cost, 10);

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const currentHam = userData.hamBalance !== undefined ? userData.hamBalance : 0;
                const inventory = userData.inventory || [];

                if (inventory.includes(cardName)) {
                    showVendorMsg(`You already own ${cardName}.`, true);
                    return;
                }

                if (currentHam >= cost) {
                    const newHamBalance = currentHam - cost;

                    await updateDoc(userRef, {
                        hamBalance: newHamBalance,
                        inventory: arrayUnion(cardName)
                    });

                    // Update HUD immediately
                    if (hudHam) hudHam.textContent = `$HAM: ${newHamBalance}`;

                    showVendorMsg(`Successfully purchased ${cardName}!`, false);

                } else {
                    showVendorMsg(`Insufficient $HAM balance. You need ${cost} $HAM.`, true);
                }
            } else {
                 showVendorMsg("User data not found.", true);
            }
        } catch (error) {
            console.error("Purchase Error:", error);
            showVendorMsg("An error occurred during purchase.", true);
        }
    });
});