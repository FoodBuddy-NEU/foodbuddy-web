// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/app/group/[groupId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ChatMessage } from '@/types/chatType';
import { subscribeGroupMessages } from '@/lib/chat';
import { useAuth } from '@/lib/AuthProvider';
import { ChatInput } from '@/app/groups/chatInput';
import { MessageBubble } from '../../../components/MessageBubble';

export default function GroupChatPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeGroupMessages(groupId, setMessages);
    return () => unsubscribe();
  }, [groupId]);

  if (!user) {
    return <div className="mx-auto max-w-2xl p-4">Please sign in to join the group chat.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl h-[calc(100vh-80px)] flex flex-col border rounded-lg">
      <header className="px-4 py-3 border-b flex items-center gap-3">
        <Link href="/groups" className="text-sm text-muted-foreground hover:underline">← Back</Link>
        <div className="font-semibold">Group chat – {groupId}</div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/40">
        {messages.length === 0 ? (
          <div className="mt-8 text-center text-sm text-muted-foreground">No messages yet. Say hi 👋</div>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} isMe={user ? m.senderId === user.uid : false} />
          ))
        )}
      </div>
      <ChatInput groupId={groupId} currentUserId={user.uid} />
    </div>
  );
}