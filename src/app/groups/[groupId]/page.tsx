// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/app/group/[groupId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { ChatMessage } from '@/types/chatType';
import { subscribeGroupMessages } from '@/lib/chat';
import { getUserProfile } from '@/lib/userProfile';
import { useAuth } from '@/lib/AuthProvider';
import { ChatInput } from '@/app/groups/chatInput';
import { MessageBubble } from '../../../components/MessageBubble';

export default function GroupChatPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { username?: string; avatarUrl?: string }>>({});

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Preload current user's profile for immediate avatar/name
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const p = await getUserProfile(user.uid);
        setProfiles((prev) => ({
          ...prev,
          [user.uid]: p
            ? { username: p.username, avatarUrl: p.avatarUrl }
            : { username: user.displayName ?? user.email?.split('@')[0] ?? 'Me', avatarUrl: user.photoURL ?? undefined },
        }));
      } catch {
        setProfiles((prev) => ({
          ...prev,
          [user.uid]: { username: user.displayName ?? user.email?.split('@')[0] ?? 'Me', avatarUrl: user.photoURL ?? undefined },
        }));
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeGroupMessages(groupId, setMessages);
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    const ids = Array.from(new Set(messages.map((m) => m.senderId))).filter((id) => !profiles[id]);
    if (!ids.length) return;
    (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const p = await getUserProfile(id);
            return [id, p ? { username: p.username, avatarUrl: p.avatarUrl } : {}] as const;
          } catch {
            return [id, {}] as const;
          }
        })
      );
      setProfiles((prev) => {
        const next = { ...prev };
        for (const [id, val] of entries) next[id] = val;
        return next;
      });
    })();
  }, [messages, profiles]);

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
            <MessageBubble
              key={m.id}
              message={m}
              isMe={user ? m.senderId === user.uid : false}
              profile={profiles[m.senderId]}
            />
          ))
        )}
      </div>
      {user ? <ChatInput groupId={groupId} currentUserId={user.uid} /> : null}
    </div>
  );
}