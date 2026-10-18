import { auth, db } from './firebase.js';
import { onAuthStateChanged, sendEmailVerification, reload } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
const $ = id => document.getElementById(id);
let user = null;
const feedback = (message, error = false) => { $('verificationFeedback').textContent = message; $('verificationFeedback').style.color = error ? '#a52b22' : '#236c45'; };
async function refresh() {
  if (!user) return;
  try {
    await reload(user);
    await user.getIdToken(true);
    $('emailVerificationStatus').textContent = user.emailVerified ? 'Email verified' : 'Email not verified';
    $('sendVerificationEmail').disabled = user.emailVerified;
    const [request, verified] = await Promise.all([getDoc(doc(db,'verificationRequests',user.uid)),getDoc(doc(db,'verificationPublic',user.uid))]);
    const state = request.exists() ? request.data().status : 'not_requested';
    const approved = verified.exists() && verified.data().identityVerified === true;
    $('identityVerificationStatus').textContent = approved ? 'Identity verified by an administrator' : state === 'pending' ? 'Review requested — awaiting administrator decision' : state === 'rejected' ? 'Request declined — contact the project administrator' : 'Identity not verified';
    $('requestIdentityVerification').disabled = approved || state === 'pending' || state === 'rejected' || !user.emailVerified;
    $('requestIdentityVerification').textContent = !user.emailVerified ? 'Verify email first' : approved ? 'Already verified' : state === 'pending' ? 'Request pending' : state === 'rejected' ? 'Contact administrator' : 'Request identity review';
  } catch (e) { feedback(e.message, true); }
}
$('sendVerificationEmail')?.addEventListener('click', async () => {
  try { if (!user || user.emailVerified) return; await sendEmailVerification(user); feedback('Verification email sent. Check your inbox and spam folder.'); }
  catch(e) { feedback(e.message,true); }
});
$('refreshEmailVerification')?.addEventListener('click', refresh);
$('requestIdentityVerification')?.addEventListener('click', async () => {
  if (!user || !user.emailVerified) return;
  const button = $('requestIdentityVerification'); button.disabled = true;
  try {
    await setDoc(doc(db,'verificationRequests',user.uid), {uid:user.uid,status:'pending',note:$('verificationNote').value.trim(),requestedAt:serverTimestamp(),reviewedAt:null,reviewedBy:null});
    $('verificationNote').value = ''; feedback('Review requested. An authorised administrator must approve it.'); await refresh();
  } catch(e) { feedback(e.message,true); button.disabled = false; }
});
onAuthStateChanged(auth, async current => { user = current; if (current) await refresh(); });
