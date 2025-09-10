// main.js — UWI Help MVP (Auth & Step-by-step Explore)

// =========================
// Firebase Imports
// =========================
import { firebaseConfig } from '/api/firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// init firebase AFTER import — only create auth if config is present
let auth = null;
if (!firebaseConfig || !firebaseConfig.projectId) {
  console.warn('firebaseConfig missing or incomplete. Check /api/firebase-config.js and Vercel env vars.');
} else {
  initializeApp(firebaseConfig);
  auth = getAuth();
}

if (auth) {
  onAuthStateChanged(auth, user => {
    renderAuthStatus(user);
    if (user) {
      renderProfileBox(user.uid);
      renderHome(user.uid);
    } else {
      profileBox.textContent = 'Sign in to see your profile.';
      $('#enrolledList').innerHTML = ''; $('#bookmarkedEvents').innerHTML = '';
    }
  });
} else {
  // No firebase available — show signed-out UI so buttons are visible
  // renderAuthStatus is defined below, but function declarations are hoisted so this is safe
  renderAuthStatus(null);
  profileBox.textContent = 'Sign in to see your profile.';
  $('#enrolledList').innerHTML = ''; $('#bookmarkedEvents').innerHTML = '';
}