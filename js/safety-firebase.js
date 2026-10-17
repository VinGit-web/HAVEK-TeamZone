import { auth, db } from './firebase.js';
import { collection, doc, addDoc, getDoc, onSnapshot, query, where, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
const pair = (a,b) => [a,b].sort().join('_');
export const blockPairId = pair;
export function watchMyBlocks(callback) {
  const uid = auth.currentUser?.uid;
  if (!uid) { callback(new Set(), []); return () => {}; }
  return onSnapshot(query(collection(db,'blockRecords'),where('participants','array-contains',uid)), snapshot => {
    const excluded = new Set(), mine = [];
    for (const item of snapshot.docs) {
      const data = item.data();
      if (!Array.isArray(data.blockedBy) || !data.blockedBy.length) continue;
      const other = data.participants.find(id => id !== uid);
      if (!other) continue;
      excluded.add(other);
      if (data.blockedBy.includes(uid)) mine.push(other);
    }
    callback(excluded, mine);
  }, error => console.error('Block listener:', error));
}
export async function blockMember(other) {
  const uid = auth.currentUser?.uid;
  if (!uid || !other || uid === other) throw Error('Invalid member.');
  const id = pair(uid,other), ref = doc(db,'blockRecords',id), connection = doc(db,'connectionRequests',id);
  await runTransaction(db, async tx => {
    const [snap, relation] = await Promise.all([tx.get(ref),tx.get(connection)]);
    const blockedBy = snap.exists() ? snap.data().blockedBy || [] : [];
    const data = {participants:[uid,other].sort(),blockedBy:[...new Set([...blockedBy,uid])],updatedAt:serverTimestamp()};
    if (snap.exists()) tx.update(ref,{blockedBy:data.blockedBy,updatedAt:data.updatedAt});
    else tx.set(ref,{...data,createdAt:serverTimestamp()});
    if (relation.exists()) tx.delete(connection);
  });
}
export async function unblockMember(other) {
  const uid = auth.currentUser?.uid;
  if (!uid || !other || uid === other) throw Error('Invalid member.');
  const ref = doc(db,'blockRecords',pair(uid,other));
  await runTransaction(db,async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists() || !snap.data().blockedBy?.includes(uid)) throw Error('You have not blocked this member.');
    tx.update(ref,{blockedBy:snap.data().blockedBy.filter(id => id !== uid),updatedAt:serverTimestamp()});
  });
}
export async function reportMember(other,reason) {
  const uid = auth.currentUser?.uid;
  const reasons = ['Harassment or bullying','Inappropriate behaviour','Spam or scam','Other'];
  if (!uid || !other || uid === other || !reasons.includes(reason)) throw Error('Invalid report.');
  await addDoc(collection(db,'reports'),{reporterUid:uid,reportedUid:other,reason,createdAt:serverTimestamp()});
}
