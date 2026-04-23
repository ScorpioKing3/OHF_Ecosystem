import { db } from './firebase.js';
import {
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// Web3Modal and Provider options
const providerOptions = {
  walletconnect: {
    package: window.WalletConnectProvider ? window.WalletConnectProvider.default : null, // required
    options: {
      infuraId: "27e484dcd9e3efcfd25a83a78777cdf1" // generic placeholder to prevent silent failures
    }
  }
};

const Web3Modal = window.Web3Modal.default;

const web3Modal = new Web3Modal({
  cacheProvider: false, // optional
  providerOptions, // required
  theme: "dark"
});

const connectWalletBtn = document.getElementById('connect-wallet-btn');
const walletStatusDisplay = document.getElementById('wallet-status');

let currentUserUid = null;

// Listen for user loaded event from auth.js
window.addEventListener('userLoaded', (e) => {
    currentUserUid = e.detail.uid;
    const existingWallet = e.detail.walletAddress;

    if (existingWallet) {
        walletStatusDisplay.textContent = `Connected: ${existingWallet.substring(0, 6)}...${existingWallet.substring(existingWallet.length - 4)}`;
        walletStatusDisplay.classList.add('text-green-400');
        walletStatusDisplay.classList.remove('text-gray-400');
        connectWalletBtn.textContent = 'CHANGE WALLET';
    } else {
        resetWalletUI();
    }
});

// Listen for logout event
window.addEventListener('userLoggedOut', () => {
    currentUserUid = null;
    resetWalletUI();
    web3Modal.clearCachedProvider();
});

function resetWalletUI() {
    walletStatusDisplay.textContent = 'Not Connected';
    walletStatusDisplay.classList.remove('text-green-400');
    walletStatusDisplay.classList.add('text-gray-400');
    connectWalletBtn.textContent = 'CONNECT WALLET';
}

async function connectWallet() {
    if (!currentUserUid) {
        alert("Please ensure you are fully logged in first.");
        return;
    }

    try {
        const provider = await web3Modal.connect();

        // Wrap the provider with ethers
        const ethersProvider = new window.ethers.providers.Web3Provider(provider);
        const signer = ethersProvider.getSigner();
        const address = await signer.getAddress();

        // Update UI
        walletStatusDisplay.textContent = `Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        walletStatusDisplay.classList.add('text-green-400');
        walletStatusDisplay.classList.remove('text-gray-400');
        connectWalletBtn.textContent = 'CHANGE WALLET';

        // Save to Firestore
        const userDocRef = doc(db, "users", currentUserUid);
        await updateDoc(userDocRef, {
            walletAddress: address
        });

        console.log("Wallet connected and saved to Firestore:", address);

        // Subscribe to accounts change
        provider.on("accountsChanged", async (accounts) => {
          if (accounts.length > 0) {
              const newAddress = accounts[0];
              walletStatusDisplay.textContent = `Connected: ${newAddress.substring(0, 6)}...${newAddress.substring(newAddress.length - 4)}`;
              await updateDoc(userDocRef, { walletAddress: newAddress });
          } else {
              resetWalletUI();
          }
        });

        // Subscribe to chainId change
        provider.on("chainChanged", (chainId) => {
          console.log("Chain changed:", chainId);
        });

        // Subscribe to provider disconnection
        provider.on("disconnect", (error) => {
          console.log("Wallet disconnected:", error);
          resetWalletUI();
        });

    } catch (e) {
        console.error("Could not get a wallet connection", e);
    }
}

connectWalletBtn.addEventListener('click', connectWallet);
