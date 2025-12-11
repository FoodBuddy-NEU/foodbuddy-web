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
  cb: (data: { name?: string; ownerId?: string; memberIds?: string[]; diningTime?: string; restaurantId?: string; restaurantName?: string; preOrder?: PreOrderData }) => void
): () => void {
  const ref = doc(db, 'groups', groupId);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? (snap.data() as { name?: string; ownerId?: string; memberIds?: string[]; diningTime?: string; restaurantId?: string; restaurantName?: string; preOrder?: PreOrderData }) : {});
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

// PreOrder item type
export interface PreOrderItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // member userIds
  isCustom: boolean;
}

// PreOrder data structure
export interface PreOrderData {
  items: PreOrderItem[];
  tipPercent: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  memberCosts: Record<string, number>; // userId -> their share
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

export async function saveGroupPreOrder(
  groupId: string, 
  items: PreOrderItem[], 
  tipPercent: number, 
  taxRate: number
): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * taxRate;
  const tip = subtotal * (tipPercent / 100);
  const total = subtotal + tax + tip;

  // Calculate per-member costs
  const memberCosts: Record<string, number> = {};
  
  items.forEach(item => {
    if (item.assignedTo.length > 0) {
      const perPersonCost = item.price / item.assignedTo.length;
      item.assignedTo.forEach(memberId => {
        memberCosts[memberId] = (memberCosts[memberId] || 0) + perPersonCost;
      });
    }
  });

  // Add proportional tax and tip to each member
  Object.keys(memberCosts).forEach(memberId => {
    if (subtotal > 0) {
      const proportion = memberCosts[memberId] / subtotal;
      memberCosts[memberId] += (tax + tip) * proportion;
    }
  });

  const preOrderData: PreOrderData = {
    items,
    tipPercent,
    taxRate,
    subtotal,
    tax,
    tip,
    total,
    memberCosts,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(groupRef, { 
    preOrder: preOrderData,
    updatedAt: serverTimestamp() 
  });
}

export async function clearGroupPreOrder(groupId: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { 
    preOrder: null,
    updatedAt: serverTimestamp() 
  });
}