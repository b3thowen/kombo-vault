export const firebaseConfig = {
  apiKey: "AIzaSyCUym9yTx-8GoJP_mV5yr0YVciMV0WwVxk",
  authDomain: "kombo-vault.firebaseapp.com",
  projectId: "kombo-vault",
  storageBucket: "kombo-vault.firebasestorage.app",
  messagingSenderId: "589444654716",
  appId: "1:589444654716:web:6b44f232b1bfaab490cbf9"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, getDocs, deleteDoc, serverTimestamp, writeBatch }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export const configured = !firebaseConfig.apiKey.startsWith("OVDE");
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut,
         doc, setDoc, getDoc, onSnapshot, collection, getDocs, deleteDoc, serverTimestamp, writeBatch };
