import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDQkTReXF1FON_GiYMgDMNRIj7BwWt3Eu8",
    authDomain: "ohf-universe.firebaseapp.com",
    projectId: "ohf-universe",
    storageBucket: "ohf-universe.firebasestorage.app",
    messagingSenderId: "933720109123",
    appId: "1:933720109123:web:5713fd7a2fd913fcb224f6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
