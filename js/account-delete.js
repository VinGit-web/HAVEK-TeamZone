import { auth } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';

// Configure this ONLY after deploying a trusted backend that verifies the
// Firebase ID token, enforces recent sign-in, and performs complete cleanup.
const DELETE_ACCOUNT_ENDPOINT = '';
const $ = id => document.getElementById(id);
const dialog = $('deleteAccountDialog');
const stepOne = $('deleteStepOne');
const stepTwo = $('deleteStepTwo');
const confirmation = $('deleteConfirmationText');
const finalButton = $('confirmDeleteAccount');
const status = $('deleteAccountStatus');
let user = null;
let busy = false;
onAuthStateChanged(auth, next => { user = next; });
function closeDialog() { if (!busy) dialog.close(); }
$('openDeleteAccount')?.addEventListener('click', () => {
  if (!user) { status.textContent = 'Sign in to manage account deletion.'; return; }
  stepOne.hidden = false; stepTwo.hidden = true;
  confirmation.value = ''; finalButton.disabled = true;
  dialog.showModal();
});
$('cancelDeleteOne')?.addEventListener('click', closeDialog);
$('cancelDeleteTwo')?.addEventListener('click', closeDialog);
$('continueDelete')?.addEventListener('click', () => {
  stepOne.hidden = true; stepTwo.hidden = false; confirmation.focus();
});
confirmation?.addEventListener('input', () => { finalButton.disabled = busy || confirmation.value !== 'DELETE'; });
dialog?.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
finalButton?.addEventListener('click', async () => {
  if (busy || !user || auth.currentUser?.uid !== user.uid || confirmation.value !== 'DELETE') return;
  if (!DELETE_ACCOUNT_ENDPOINT) {
    status.textContent = 'Account deletion is not configured yet. No account data has been deleted.';
    dialog.close(); return;
  }
  busy = true; finalButton.disabled = true; status.textContent = 'Submitting deletion request...';
  try {
    const token = await user.getIdToken(true);
    const response = await fetch(DELETE_ACCOUNT_ENDPOINT, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: 'DELETE' })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Deletion request failed (${response.status}).`);
    dialog.close();
    status.textContent = result.message || 'Deletion request accepted. Follow the instructions provided by the service.';
  } catch (error) {
    status.textContent = error.message || 'Deletion request failed. Your account has not been confirmed deleted.';
  } finally { busy = false; finalButton.disabled = confirmation.value !== 'DELETE'; }
});
