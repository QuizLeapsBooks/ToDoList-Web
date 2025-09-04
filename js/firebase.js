import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDye5JFd9jCx4l3JuT9LMMnv2TEmnth0rY",
  authDomain: "note-sflow.firebaseapp.com",
  projectId: "note-sflow",
  storageBucket: "note-sflow.firebasestorage.app",
  messagingSenderId: "512280858386",
  appId: "1:512280858386:web:ae27c1f192cd8ddf0a2dcb"
};

const app = initializeApp(firebaseConfig);
window.auth = getAuth(app);
window.db = getFirestore(app);
console.log('Firebase initialized');