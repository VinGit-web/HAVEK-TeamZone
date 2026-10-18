import {auth,db} from '../firebase.js';
import {onAuthStateChanged,sendEmailVerification,reload} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {doc,getDoc} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
import {getFunctions,httpsCallable} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-functions.js';
const $=id=>document.getElementById(id);
const functions=getFunctions(auth.app,'australia-southeast1');
let user;
function message(text,error=false){$('verificationFeedback').textContent=text;$('verificationFeedback').style.color=error?'#a52b22':'#236c45';}
async function refresh(){if(!user)return;try{await reload(user);await user.getIdToken(true);$('emailVerificationStatus').textContent=user.emailVerified?'Email verified':'Email not verified';$('sendVerificationEmail').disabled=user.emailVerified;$('startAgeCheck').disabled=!user.emailVerified||!$('ageConsent').checked;const snap=await getDoc(doc(db,'verificationPublic',user.uid));$('ageVerificationStatus').textContent=snap.exists()&&snap.data().ageChecked===true&&snap.data().ageThreshold===18?'Age Checked (18+)':'Age not checked';}catch(e){message(e.message,true);}}
$('ageConsent').addEventListener('change',()=>{$('startAgeCheck').disabled=!user?.emailVerified||!$('ageConsent').checked;});
$('sendVerificationEmail').addEventListener('click',async()=>{try{if(!user||user.emailVerified)return;await sendEmailVerification(user);message('Verification email sent.');}catch(e){message(e.message,true);}});
$('refreshEmailVerification').addEventListener('click',refresh);
$('refreshAgeCheck').addEventListener('click',refresh);
$('startAgeCheck').addEventListener('click',async()=>{if(!user?.emailVerified||!$('ageConsent').checked)return;const b=$('startAgeCheck');b.disabled=true;try{const result=await httpsCallable(functions,'startAgeAssurance')({consent:true});if(!result.data?.redirectUrl)throw Error('Provider did not return a session URL.');location.assign(result.data.redirectUrl);}catch(e){message(e.message,true);b.disabled=false;}});
$('requestAgeReview').addEventListener('click',async()=>{const b=$('requestAgeReview');b.disabled=true;try{await httpsCallable(functions,'requestAlternativeReview')({reason:$('ageAppealReason').value.trim()});message('Alternative review requested. No badge is granted until an assessment is completed.');}catch(e){message(e.message,true);}finally{b.disabled=false;}});
onAuthStateChanged(auth,async current=>{user=current;if(current)await refresh();});
