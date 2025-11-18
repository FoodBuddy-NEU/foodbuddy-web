// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/app/group/[groupId]/MessageBubble.tsx
'use client';

import type { ChatMessage } from '@/types/chatType';

type Props = {
  message: ChatMessage;
  isMe: boolean;
};

export function MessageBubble({ message, isMe }: Props) {
  const wrapper = isMe ? 'flex justify-end' : 'flex justify-start';
  const bubble = 'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow border bg-background';
  return (
    <div className={wrapper}>
      <div className={bubble}>
        <p>{message.text}</p>
      </div>
    </div>
  );
}