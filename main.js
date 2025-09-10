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

// --- small DOM helpers (must be available before auth handlers run) ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const escapeHtml = (str = '') => String(str).replace(/[&<>\"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[m]));

// --- safe DOM refs used by early auth handling ---
const profileBox = document.getElementById('profileBox');

// minimal fallback renderer so calls before full app init won't throw
function renderAuthStatus(user) {
  const authWrap = document.getElementById('authStatus');
  if (!authWrap) return;
  authWrap.innerHTML = '';

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

// Small resilient UI init: ensure nothing is blocking the page and wire core buttons
(function initUI() {
  // helper to safely query
  const $safe = (s) => { try { return document.querySelector(s); } catch(e){ return null; } };

  // 1) remove any accidental full-screen overlays that may block clicks
  try {
    // hide profile pop if left open
    const pp = $safe('#profilePop'); if (pp) pp.style.display = 'none';
    // close auth dialog if open
    const ad = $safe('#authDialog'); if (ad && typeof ad.close === 'function') { try { ad.close(); } catch(e){} }
    // ensure body accepts pointer events
    document.body.style.pointerEvents = 'auto';
  } catch (e) { /* ignore */ }

  // 2) wire top nav tabs if not already wired
  try {
    $$('.tab').forEach(t => {
      if (!t._wired) {
        t.addEventListener('click', () => {
          const p = t.dataset.goto;
          if (typeof goto === 'function' && p) goto(p);
        });
        t._wired = true;
      }
    });
  } catch(e){}

  // 3) wire auth dialog submit (Sign Up / Log In)
  try {
    const authForm = $safe('#authForm');
    const authTitle = $safe('#authTitle');
    const authError = $safe('#authError');
    const authEmail = $safe('#authEmail');
    const authPass = $safe('#authPass');
    const authDlg = $safe('#authDialog');

    if (authForm && authTitle && authEmail && authPass) {
      // ensure previous handler removed and add new
      authForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        authError.textContent = '';
        const mode = (authTitle.textContent || '').toLowerCase().includes('sign up') ? 'signup' : 'login';
        const email = (authEmail.value || '').trim();
        const pass = (authPass.value || '').trim();
        if (!email || !pass) { authError.textContent = 'Provide email and password.'; return; }
        if (!auth) { authError.textContent = 'Auth not available. Check firebase config.'; return; }

        try {
          if (mode === 'signup') {
            await createUserWithEmailAndPassword(auth, email, pass);
            if (authDlg && typeof authDlg.close === 'function') authDlg.close();
          } else {
            await signInWithEmailAndPassword(auth, email, pass);
            if (authDlg && typeof authDlg.close === 'function') authDlg.close();
          }
        } catch (err) {
          console.error('Auth failed', err);
          authError.textContent = (err && err.message) ? err.message : 'Authentication failed.';
        }
      });

      // cancel button behaviour already in HTML uses onclick, but ensure dialog closes on ESC
      if (authDlg) {
        authDlg.addEventListener('cancel', () => { if (authError) authError.textContent = ''; });
      }
    }
  } catch(e){ console.warn('auth wiring failed', e); }

  // 4) ensure other core buttons are wired (Enroll/unEnroll/back etc.) if their handlers exist
  try {
    const backTo1 = $safe('#backTo1'); if (backTo1 && !backTo1._wired) { backTo1.addEventListener('click', () => setStep(1)); backTo1._wired = true; }
    const backTo2 = $safe('#backTo2'); if (backTo2 && !backTo2._wired) { backTo2.addEventListener('click', () => setStep(2)); backTo2._wired = true; }
    const backTo3 = $safe('#backTo3'); if (backTo3 && !backTo3._wired) { backTo3.addEventListener('click', () => setStep(3)); backTo3._wired = true; }
  } catch(e){}

  // 5) safety: re-run small sanity after a short delay (covers deferred DOM builds)
  setTimeout(() => {
    try { document.body.style.pointerEvents = 'auto'; } catch(e){}
  }, 250);
})();