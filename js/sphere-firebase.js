import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { collection, doc, getDoc, onSnapshot, query, where, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
import { watchMyBlocks } from './safety-firebase.js';
const requestsRef = collection(db,'connectionRequests');
let excludedMembers = new Set();
let activeUser=null, privateProfile=null, privatePersona=null;
let publicMembers=new Map(), publicDetails=new Map(), sharedProfiles=new Map(), incoming=new Map(), outgoing=new Map();
let unsubscribers=[], sharedUnsubscribers=new Map(), generation=0;
const subscribers=new Set();
const pairId=(a,b)=>[a,b].sort().join('_');
const nameOf=(p,fallback='INTROSPHEER User')=>p?.username||p?.displayName||fallback;
const allRequests=()=>[...new Map([...incoming.values(),...outgoing.values()].map(r=>[r.id,r])).values()];
function getRequestFor(uid){return activeUser ? allRequests().find(r=>r.id===pairId(activeUser.uid,uid))||null:null;}
export const getSphereRequest=getRequestFor;
export const isSphereConnected=uid=>!excludedMembers.has(uid)&&getRequestFor(uid)?.status==='accepted';
export const isSphereBlocked=uid=>excludedMembers.has(uid);
function notify(){const state=getSphereState();for(const callback of subscribers){try{callback(state);}catch(e){console.error('Sphere subscriber failed:',e);}}}
function profileFields(uid,connected){return connected ? (sharedProfiles.get(uid)||{}) : (publicDetails.get(uid)?.fields||{});}
export function getSphereState(){
 const uid=activeUser?.uid||null;
 const me=uid?{id:uid,uid,name:nameOf(privateProfile,activeUser.displayName||activeUser.email?.split('@')[0]||'You'),avatar:privateProfile?.avatar||null,age:privateProfile?.birthYear?new Date().getFullYear()-privateProfile.birthYear:null,gender:privateProfile?.gender||null,mbti:privatePersona?.mbti||null,interests:privatePersona?.interests||[],suburb:privatePersona?.suburb||null,about:privatePersona?.persona||null,centre:true}:null;
 const toMember=(profile,connected)=>{const uid=profile.uid;const data=profileFields(uid,connected);return {id:uid,uid,name:nameOf(profile),avatar:profile.avatar||null,connected,age:data.age??null,gender:data.gender??null,mbti:data.mbti??null,interests:data.interests||[],suburb:data.suburb??null,about:data.about??null};};
 const connections=allRequests().filter(r=>r.status==='accepted').map(r=>{const id=r.fromUid===uid?r.toUid:r.fromUid;return !excludedMembers.has(id)&&publicMembers.has(id)?toMember(publicMembers.get(id),true):null;}).filter(Boolean);
 return {uid,me,connections,requests:allRequests(),publicMembers:[...publicMembers.values()].filter(p=>p.uid!==uid&&!excludedMembers.has(p.uid)).map(p=>toMember(p,isSphereConnected(p.uid)))};
}
export function subscribeToSphere(callback){subscribers.add(callback);callback(getSphereState());return()=>subscribers.delete(callback);}
export async function sendSphereRequest(targetUid){
 if(!activeUser)throw Error('You must be signed in.');
 if(!targetUid||targetUid===activeUser.uid)throw Error('Choose another user.');if(excludedMembers.has(targetUid))throw Error('This member is unavailable.');
 const target=publicMembers.get(targetUid);if(!target)throw Error('This user does not have a public profile.');
 const myUid=activeUser.uid,ref=doc(db,'connectionRequests',pairId(myUid,targetUid));
 await runTransaction(db,async tx=>{const existing=await tx.get(ref);if(existing.exists()){const data=existing.data();if(data.status!=='declined')throw Error('A connection request already exists.');if(data.fromUid!==myUid)throw Error('You cannot resend a request initiated by the other user.');tx.update(ref,{status:'pending',updatedAt:serverTimestamp()});return;}
 tx.set(ref,{fromUid:myUid,toUid:targetUid,fromName:nameOf(privateProfile,activeUser.displayName),toName:nameOf(target),status:'pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});});
}
export async function respondToSphereRequest(targetUid,decision){
 if(!activeUser)throw Error('You must be signed in.');if(excludedMembers.has(targetUid))throw Error('This member is unavailable.');if(!['accepted','declined'].includes(decision))throw Error('Invalid response.');
 const ref=doc(db,'connectionRequests',pairId(activeUser.uid,targetUid));
 await runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw Error('Request not found.');const r=snap.data();if(r.toUid!==activeUser.uid||r.status!=='pending')throw Error('This request cannot be updated.');tx.update(ref,{status:decision,updatedAt:serverTimestamp()});});
}
function syncShared(g){
 if(g!==generation||!activeUser)return;
 const ids=new Set(allRequests().filter(r=>r.status==='accepted').map(r=>r.fromUid===activeUser.uid?r.toUid:r.fromUid).filter(id=>!excludedMembers.has(id)));
 for(const [uid,stop] of sharedUnsubscribers){if(!ids.has(uid)){stop();sharedUnsubscribers.delete(uid);sharedProfiles.delete(uid);}}
 for(const uid of ids){if(sharedUnsubscribers.has(uid))continue;sharedUnsubscribers.set(uid,onSnapshot(doc(db,'sharedProfiles',uid),snap=>{if(g!==generation)return;if(snap.exists())sharedProfiles.set(uid,snap.data());else sharedProfiles.delete(uid);notify();},error=>console.error('Shared profile listener:',error)));}
 notify();
}
async function loadMyProfile(user,g){try{const [p,s]=await Promise.all([getDoc(doc(db,'users',user.uid)),getDoc(doc(db,'userPersonas',user.uid))]);if(g!==generation)return;privateProfile=p.exists()?p.data():null;privatePersona=s.exists()?s.data():null;notify();}catch(e){console.error('Unable to load Sphere account:',e);}}
function startListening(user){const g=++generation;for(const stop of unsubscribers)stop();unsubscribers=[];for(const stop of sharedUnsubscribers.values())stop();sharedUnsubscribers.clear();activeUser=user;privateProfile=null;privatePersona=null;publicMembers.clear();publicDetails.clear();sharedProfiles.clear();incoming.clear();outgoing.clear();excludedMembers=new Set();notify();if(!user)return;unsubscribers.push(watchMyBlocks((excluded)=>{if(g!==generation)return;excludedMembers=excluded;syncShared(g);notify();}));loadMyProfile(user,g);
 unsubscribers.push(onSnapshot(collection(db,'publicProfiles'),snap=>{if(g!==generation)return;publicMembers=new Map(snap.docs.map(d=>[d.id,{...d.data(),id:d.id,uid:d.id}]));notify();},e=>console.error('Public profile listener:',e)));
 unsubscribers.push(onSnapshot(collection(db,'publicDetails'),snap=>{if(g!==generation)return;publicDetails=new Map(snap.docs.map(d=>[d.id,d.data()]));notify();},e=>console.error('Public details listener:',e)));
 for(const [direction,field] of [['incoming','toUid'],['outgoing','fromUid']])unsubscribers.push(onSnapshot(query(requestsRef,where(field,'==',user.uid)),snap=>{if(g!==generation)return;const map=new Map(snap.docs.map(d=>[d.id,{...d.data(),id:d.id}]));if(direction==='incoming')incoming=map;else outgoing=map;syncShared(g);},e=>console.error(`${direction} Sphere requests:`,e)));
}
onAuthStateChanged(auth,startListening);
