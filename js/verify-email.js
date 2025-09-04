import { getAuth, onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";

const firebaseConfig = {
   apiKey: "AIzaSyDye5JFd9jCx4l3JuT9LMMnv2TEmnth0rY",
  authDomain: "note-sflow.firebaseapp.com",
  projectId: "note-sflow",
  storageBucket: "note-sflow.firebasestorage.app",
  messagingSenderId: "512280858386",
  appId: "1:512280858386:web:ae27c1f192cd8ddf0a2dcb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function showMessage(message, isError = true) {
  const messageDiv = document.getElementById("verifyMessage");
  messageDiv.style.display = "block";
  messageDiv.textContent = message;
  messageDiv.style.color = isError ? "red" : "green";
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 5000);
}

window.checkVerification = async () => {
  const user = auth.currentUser;
  if (user) {
    await user.reload(); // Refresh user data
    if (user.emailVerified) {
      showMessage("Email verified! Redirecting to dashboard...", false);
      setTimeout(() => location.replace("https://quizleapsbooks.github.io/ToDoList-Web/htmls/dashboard.html"), 2000);
    } else {
      showMessage("Email not verified yet. Please check your inbox or resend the email.");
    }
  } else {
    showMessage("No user logged in. Please sign up or log in.");
  }
};

window.resendVerification = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await sendEmailVerification(user);
      showMessage("Verification email resent. Please check your inbox.", false);
    } catch (error) {
      showMessage("Failed to resend verification email.");
    }
  } else {
    showMessage("No user logged in. Please sign up or log in.");
  }
};

// Check user status on page load
onAuthStateChanged(auth, (user) => {
  if (user && user.emailVerified) {
    showMessage("Email already verified! Redirecting to dashboard...", false);
    setTimeout(() => location.replace("https://quizleapsbooks.github.io/ToDoList-Web/htmls/dashboard.html"), 2000);
  }
});