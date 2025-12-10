// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/lib/chat.ts
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import type { ChatMessage } from '@/types/chatType';

type SendTextMessageParams = {
  groupId: string;
  senderId: string;
  text: string;
};

export async function sendTextMessage({ groupId, senderId, text }: SendTextMessageParams): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  await addDoc(messagesRef, {
    groupId,
    senderId,
    type: 'text',
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}

export function subscribeGroupMessages(groupId: string, callback: (messages: ChatMessage[]) => void): () => void {
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<ChatMessage, 'id'>;
      return { id: doc.id, ...data };
    });
    callback(messages);
  });
  return unsubscribe;
}

export async function createGroup(name: string, ownerId: string): Promise<string> {
  const groupsRef = collection(db, 'groups');
  const docRef = await addDoc(groupsRef, {
    name: name.trim() || 'Untitled',
    ownerId,
    memberIds: [ownerId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function addGroupMember(groupId: string, uid: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { memberIds: arrayUnion(uid), updatedAt: serverTimestamp() });
}

export async function removeGroupMember(groupId: string, uid: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { memberIds: arrayRemove(uid), updatedAt: serverTimestamp() });
}

export async function disbandGroup(groupId: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  // Delete messages first so no subcollection docs remain; many providers
  // require explicit cleanup of subcollections, and rules often reference
  // the parent doc for membership checks, which would deny access once deleted.
  const snap = await getDocs(messagesRef);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  // Finally delete the group document
  await deleteDoc(groupRef);
}

export function subscribeGroupMeta(
  groupId: string,
  cb: (data: { name?: string; ownerId?: string; memberIds?: string[]; diningTime?: string; restaurantId?: string; restaurantName?: string }) => void
): () => void {
  const ref = doc(db, 'groups', groupId);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? (snap.data() as { name?: string; ownerId?: string; memberIds?: string[]; diningTime?: string; restaurantId?: string; restaurantName?: string }) : {});
  });
}

export async function updateGroupDiningTime(groupId: string, diningTime: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { diningTime, updatedAt: serverTimestamp() });
}

export async function updateGroupRestaurant(groupId: string, restaurantId: string, restaurantName: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { restaurantId, restaurantName, updatedAt: serverTimestamp() });
}