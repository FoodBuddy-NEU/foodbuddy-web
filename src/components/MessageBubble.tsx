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
  const name = profile?.username || 'Unknown';
  const avatar = profile?.avatarUrl || '/icon.png';
  
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex items-start gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        <Image 
          src={avatar} 
          alt={name} 
          width={32} 
          height={32} 
          className="rounded-full object-cover flex-shrink-0" 
        />
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
          <span className="text-xs text-muted-foreground mb-1">{name}</span>
          <div className="rounded-2xl px-4 py-2 text-sm shadow border bg-background">
            {message.text}
          </div>
        </div>
      </div>
    </div>
  );
}