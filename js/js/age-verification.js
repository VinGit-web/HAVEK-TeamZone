
import { auth, db } from './firebase.js';
import {
  onAuthStateChanged,
  sendEmailVerification,
  reload
} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';

const $ = id => document.getElementById(id);

let user = null;

const startButton = $('startAgeCheck');
const reviewButton = $('requestAgeReview');
const consent = $('ageConsent');
const feedback = $('verificationFeedback');

const prototypeNotice = document.createElement('p');
prototypeNotice.textContent = 'Prototype mode: the age-assurance provider is not connected. No age verification or alternative review is performed.';
prototypeNotice.style.fontWeight = '600';
prototypeNotice.style.color = '#825600';

$('ageVerificationStatus').before(prototypeNotice);

function message(text, error = false) {
  feedback.textContent = text;
  feedback.style.color = error ? '#a52b22' : '#236c45';
}

async function refresh() {
  if (!user) return;

  try {
    await reload(user);
    await user.getIdToken(true);

    $('emailVerificationStatus').textContent =
      user.emailVerified ? 'Email verified' : 'Email not verified';

    $('sendVerificationEmail').disabled = user.emailVerified;

    const snapshot = await getDoc(
      doc(db, 'verificationPublic', user.uid)
    );

    const data = snapshot.exists() ? snapshot.data() : null;

    const ageChecked =
      data?.ageChecked === true &&
      data?.ageThreshold === 18;

    $('ageVerificationStatus').textContent = ageChecked
      ? 'Age Checked (18+) — existing provider record'
      : 'Age not checked — provider integration pending';

  } catch (error) {
    message(error.message, true);
  }
}

startButton.disabled = true;
reviewButton.disabled = true;

startButton.textContent = 'Age check unavailable';
reviewButton.textContent = 'Alternative review unavailable';

consent.disabled = true;

$('ageAppealReason').disabled = true;
$('ageAppealReason').placeholder =
  'Alternative review will be available when the provider is connected.';

$('sendVerificationEmail').addEventListener('click', async () => {
  if (!user || user.emailVerified) return;

  const button = $('sendVerificationEmail');
  button.disabled = true;

  try {
    await sendEmailVerification(user);
    message('Verification email sent. Check your inbox.');
  } catch (error) {
    message(error.message, true);
  } finally {
    button.disabled = user?.emailVerified === true;
  }
});

$('refreshEmailVerification').addEventListener('click', refresh);
$('refreshAgeCheck').addEventListener('click', refresh);

onAuthStateChanged(auth, async current => {
  user = current;

  if (!current) {
    $('emailVerificationStatus').textContent = 'Sign in required';
    $('ageVerificationStatus').textContent = 'Sign in required';
    $('sendVerificationEmail').disabled = true;
    return;
  }

  await refresh();
});
