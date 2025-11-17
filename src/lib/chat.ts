// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/lib/chat.ts
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
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