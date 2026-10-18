import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
const $ = id => document.getElementById(id);
let reviewer = null;
async function load() {
  const list = $('reviewList'); list.replaceChildren();
  const snap = await getDocs(query(collection(db,'verificationRequests'),where('status','==','pending')));
  $('reviewStatus').textContent = `${snap.size} pending request(s)`;
  for (const item of snap.docs) {
    const data = item.data(), row = document.createElement('section');
    row.style.cssText = 'padding:18px;margin:12px 0;border:1px solid #ccc;border-radius:12px';
    const title = document.createElement('h2'); title.textContent = data.uid;
    const note = document.createElement('p'); note.textContent = data.note || 'No message provided';
    const approve = document.createElement('button'); approve.type = 'button'; approve.textContent = 'Approve reviewed identity';
    const reject = document.createElement('button'); reject.type = 'button'; reject.textContent = 'Decline request';
    const act = async decision => {
      if (!confirm(`Confirm ${decision} for ${data.uid}?`)) return;
      approve.disabled = true; reject.disabled = true;
      try {
        await updateDoc(doc(db,'verificationRequests',data.uid),{status:decision,reviewedAt:serverTimestamp(),reviewedBy:reviewer.uid});
        if (decision === 'approved') await setDoc(doc(db,'verificationPublic',data.uid),{identityVerified:true,verifiedAt:serverTimestamp()});
        await load();
      } catch(e) { $('reviewStatus').textContent = `Review error: ${e.message}`; approve.disabled = false; reject.disabled = false; }
    };
    approve.addEventListener('click',()=>act('approved')); reject.addEventListener('click',()=>act('rejected'));
    row.append(title,note,approve,reject); list.append(row);
  }
}
onAuthStateChanged(auth,async user=>{
  reviewer = user;
  if (!user) { $('reviewStatus').textContent = 'Sign in required.'; return; }
  try {
    const token = await user.getIdTokenResult(true);
    if (token.claims.admin !== true) { $('reviewStatus').textContent = 'Administrator access required.'; return; }
    await load();
  } catch(e) { $('reviewStatus').textContent = e.message; }
});
