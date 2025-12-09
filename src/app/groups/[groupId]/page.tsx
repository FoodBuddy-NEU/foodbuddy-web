// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/app/group/[groupId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import type { ChatMessage } from '@/types/chatType';
import { subscribeGroupMessages, subscribeGroupMeta, addGroupMember } from '@/lib/chat';
import { getUserProfile, searchUsersByUsername } from '@/lib/userProfile';
import { useAuth } from '@/lib/AuthProvider';
import { ChatInput } from '@/app/groups/chatInput';
import { MessageBubble } from '../../../components/MessageBubble';

// Convert Cloudinary HEIC URLs to JPG format for browser compatibility
function convertCloudinaryUrl(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // If URL ends with .heic, replace with .jpg
  if (url.toLowerCase().endsWith('.heic')) {
    return url.replace(/\.heic$/i, '.jpg');
  }
  
  // Add f_auto to auto-convert format if not already present
  if (url.includes('/upload/') && !url.includes('f_auto')) {
    return url.replace('/upload/', '/upload/f_auto/');
  }
  
  return url;
}

// Avatar component with error handling
function UserAvatar({ avatarUrl, username }: { avatarUrl?: string; username: string }) {
  const [imgError, setImgError] = useState(false);
  
  // Convert HEIC to JPG for browser compatibility
  const processedUrl = avatarUrl ? convertCloudinaryUrl(avatarUrl) : undefined;
  
  if (!processedUrl || imgError) {
    return (
      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
        {username?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  }
  
  return (
    <Image 
      src={processedUrl} 
      alt={username} 
      width={24} 
      height={24} 
      className="rounded-full object-cover"
      onError={() => setImgError(true)}
    />
  );
}

export default function GroupChatPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { username?: string; avatarUrl?: string }>>({});
  const [groupName, setGroupName] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ userId: string; username: string; avatarUrl?: string }>>([]);

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
    const unsub = subscribeGroupMeta(groupId, (d) => {
      setGroupName((d.name as string) ?? null);
      setMemberIds(Array.isArray(d.memberIds) ? d.memberIds : []);
    });
    return () => unsub();
  }, [groupId]);

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

  useEffect(() => {
    let active = true;
    (async () => {
      const t = search.trim().toLowerCase();
      if (t.length < 2) {
        setResults([]);
        return;
      }
      const r = await searchUsersByUsername(t, 8);
      console.log('Search results:', JSON.stringify(r, null, 2));
      if (active) setResults(r.filter((u) => !memberIds.includes(u.userId)));
    })();
    return () => {
      active = false;
    };
  }, [search, memberIds]);

  return (
    <div className="mx-auto max-w-2xl h-[calc(100vh-80px)] flex flex-col border rounded-lg">
      <header className="px-4 py-3 border-b flex items-center gap-3">
        <Link href="/groups" className="text-sm text-muted-foreground hover:underline">← Back</Link>
        <div className="font-semibold">Group chat – {groupName ?? groupId}</div>
        <button className="ml-auto text-xs border rounded px-2 py-1" onClick={() => setShowManage((v) => !v)}>
          {showManage ? 'Close' : 'Manage members'}
        </button>
      </header>

      {showManage && (
        <div className="border-b p-3 text-sm flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search usernames…"
              className="flex-1 rounded border px-2 py-1"
            />
          </div>
          {results.length > 0 ? (
            <ul className="space-y-2">
              {results.map((u) => (
                <li key={u.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar avatarUrl={u.avatarUrl} username={u.username} />
                    <span>{u.username}</span>
                  </div>
                  <button
                    className="text-xs border rounded px-2 py-1"
                    onClick={async () => {
                      try {
                        await addGroupMember(groupId, u.userId);
                        setSearch('');
                        setResults([]);
                      } catch (e) {
                        console.error('Add member failed', e);
                        alert('Could not add member');
                      }
                    }}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground">Type at least 2 characters to search</div>
          )}
        </div>
      )}

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