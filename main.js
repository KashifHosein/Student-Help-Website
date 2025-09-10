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

// safe DOM helpers used early
const profileBox = document.getElementById('profileBox');

// minimal fallback renderer so calls before full app init won't throw
function renderAuthStatus(user) {
  const authWrap = document.getElementById('authStatus');
  if (!authWrap) return;
  authWrap.innerHTML = '';

  // if user is signed in show a simple profile button (full UI will replace this)
  if (user) {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = user.displayName || (user.email || '').split('@')[0];
    btn.addEventListener('click', () => {
      const pop = document.getElementById('profilePop');
      if (pop) pop.style.display = 'flex';
    });
    authWrap.appendChild(btn);

    const out = document.createElement('button');
    out.className = 'btn';
    out.style.marginLeft = '8px';
    out.textContent = 'Log Out';
    out.addEventListener('click', async () => {
      if (auth) await signOut(auth);
    });
    authWrap.appendChild(out);
    return;
  }

  // signed-out view: simple Log In / Sign Up buttons
  const login = document.createElement('button');
  login.className = 'btn';
  login.textContent = 'Log In';
  login.addEventListener('click', () => {
    const dlg = document.getElementById('authDialog');
    if (dlg && typeof dlg.showModal === 'function') {
      document.getElementById('authTitle').textContent = 'Log In';
      dlg.showModal();
    }
  });

  const signup = document.createElement('button');
  signup.className = 'btn';
  signup.style.marginLeft = '8px';
  signup.textContent = 'Sign Up';
  signup.addEventListener('click', () => {
    const dlg = document.getElementById('authDialog');
    if (dlg && typeof dlg.showModal === 'function') {
      document.getElementById('authTitle').textContent = 'Sign Up';
      dlg.showModal();
    }
  });

  authWrap.appendChild(login);
  authWrap.appendChild(signup);
}