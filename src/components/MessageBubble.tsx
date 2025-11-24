// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/app/group/[groupId]/MessageBubble.tsx
'use client';

import Image from 'next/image';
import type { ChatMessage } from '@/types/chatType';

type SenderProfile = { username?: string; avatarUrl?: string };

type Props = {
  message: ChatMessage;
  isMe: boolean;
  profile?: SenderProfile;
};

export function MessageBubble({ message, isMe, profile }: Props) {
  const wrapper = isMe ? 'flex justify-end' : 'flex justify-start';
  const bubble = 'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow border bg-background';
  const name = profile?.username || 'Unknown';
  const avatar = profile?.avatarUrl || '/icon.png';
  return (
    <div className={wrapper}>
      <div className="flex items-start gap-2">
        <Image
          src={avatar}
          alt={name}
          width={28}
          height={28}
          className="rounded-full object-cover"
        />
        <div>
          <div className="text-xs text-muted-foreground mb-1">{name}</div>
          <div className={bubble}>
            <p>{message.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
