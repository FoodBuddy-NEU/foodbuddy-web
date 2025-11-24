// src/types/chatType.ts
import type { Timestamp } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

export type ServerTs = ReturnType<typeof serverTimestamp>;
export type MessageType = 'text';

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  type: MessageType;
  text: string;
  createdAt: Timestamp | null;
}

export type NewChatMessage = Omit<ChatMessage, 'createdAt'> & { createdAt: ServerTs };
