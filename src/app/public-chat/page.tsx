
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { getOrCreatePublicChannel } from '@/lib/chat';

const DEFAULT_CHANNEL_NAMES = [
  'Cybersecurity',
  'Data Science',
  'Computer Science',
  'Computer Engineering',
  'Design',
  'Africana Studies',
];

type PublicChannel = {
  id: string;
  name: string;
  participantCount?: number;
};

export default function PublicChannelsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
   const [channels, setChannels] = useState<PublicChannel[]>([]);

  // Seed default channels in Firestore (idempotent) and subscribe to all public channels
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        await Promise.all(DEFAULT_CHANNEL_NAMES.map((name) => getOrCreatePublicChannel(name)));
      } catch (e) {
        console.error('Failed to ensure default public channels exist', e);
      }
    })();

    const ref = collection(db, 'publicChannels');
    const q = query(ref, orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      const byName = new Map<string, PublicChannel>();

      snap.docs.forEach((doc) => {
        const d = doc.data() as { name?: string; participantIds?: string[] };
        const rawName = (d.name ?? doc.id).trim();
        if (!rawName) return;
        const key = rawName.toLowerCase();

        const participantCount = Array.isArray(d.participantIds)
          ? d.participantIds.length
          : undefined;

        const existing = byName.get(key);
        if (!existing) {
          byName.set(key, {
            id: doc.id,
            name: rawName,
            participantCount,
          });
        } else {
          // Merge participant counts by taking the max we know about
          const maxCount = Math.max(
            existing.participantCount ?? 0,
            participantCount ?? 0
          );
          byName.set(key, {
            ...existing,
            participantCount: maxCount || undefined,
          });
        }
      });

      setChannels(Array.from(byName.values()));
    }, (err) => {
      console.error('Public channels listener error', err);
      setChannels([]);
    });

    return () => unsub();
  }, [user]);

  // Filter channels based on search
  const filteredChannels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter((channel) =>
      channel.name.toLowerCase().includes(q)
    );
  }, [searchQuery, channels]);

  if (!user) {
    return <div className="max-w-2xl mx-auto p-4">Please sign in to view public channels.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold">Public Channels</h1>
        <div className="w-0" />
      </header>

      {/* SEARCH CONTROLS */}
      <div className="flex gap-2">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search channels by name"
          className="flex-1 border rounded px-3 py-2"
        />
      </div>

      {channels.length === 0 ? (
        <div className="text-sm text-muted-foreground">No public channels available.</div>
      ) : filteredChannels.length === 0 ? (
        <div className="text-sm text-muted-foreground">No channels match your search.</div>
      ) : (
        <ul className="space-y-2">
          {filteredChannels.map((channel) => (
            <li key={channel.id}>
              <Link
                href={`/public-chat/${encodeURIComponent(channel.name)}`}
                className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">🌐 {channel.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Public Channel • Anyone can post
                    {typeof channel.participantCount === 'number' ? ` • 🧑‍🤝‍🧑 ${channel.participantCount}` : ''}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">→</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
