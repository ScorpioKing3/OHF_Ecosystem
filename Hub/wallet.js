import { db } from './firebase.js';
import {
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// Import Web3Modal CDN bundles
import { createWeb3Modal, defaultConfig } from 'https://cdn.jsdelivr.net/npm/@web3modal/ethers@5.0.11/dist/bundle.js';

// Define project ID for WalletConnect (you usually need a real one for production, we will use a demo or free one here, but user hasn't provided one so we'll leave a placeholder/demo)
const projectId = 'b45c26cefb22cdbdff9a2b5e28a50ed1'; // Example project ID for testing purposes, user should replace this for production.

// 2. Set chains
const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
}

// 3. Create your application's metadata object
const metadata = {
  name: 'Old Ham Farms',
  description: 'Old Ham Farms Community Hub',
  url: 'https://oldham.farm', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,
  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: true, // true by default
  rpcUrl: '...', // used for the Coinbase SDK
  defaultChainId: 1 // used for the Coinbase SDK
})

// 5. Create a Web3Modal instance
const modal = createWeb3Modal({
  ethersConfig,
  chains: [mainnet],
  projectId,
  enableAnalytics: true // Optional - defaults to your Cloud configuration
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
    // Optional: disconnect web3modal if needed
});

function resetWalletUI() {
    walletStatusDisplay.textContent = 'Not Connected';
    walletStatusDisplay.classList.remove('text-green-400');
    walletStatusDisplay.classList.add('text-gray-400');
    connectWalletBtn.textContent = 'CONNECT WALLET';
}

// Handle Connect Button click
connectWalletBtn.addEventListener('click', async () => {
    if (!currentUserUid) {
        alert("Please ensure you are fully logged in first.");
        return;
    }

    // Open Web3Modal
    modal.open();
});

// Listen for Web3Modal connection events to save to Firestore
modal.subscribeProvider(async (state) => {
  if (state.isConnected && state.address && currentUserUid) {
      const address = state.address;

      // Update UI
      walletStatusDisplay.textContent = `Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      walletStatusDisplay.classList.add('text-green-400');
      walletStatusDisplay.classList.remove('text-gray-400');
      connectWalletBtn.textContent = 'CHANGE WALLET';

      // Save to Firestore
      try {
          const userDocRef = doc(db, "users", currentUserUid);
          await updateDoc(userDocRef, {
              walletAddress: address
          });
          console.log("Wallet connected and saved to Firestore:", address);
      } catch (error) {
          console.error("Error saving wallet to Firestore:", error);
      }
  } else if (!state.isConnected) {
      resetWalletUI();
  }
});
