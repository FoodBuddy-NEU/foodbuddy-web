// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/app/groups/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { createGroup } from '@/lib/chat';
import { getUserProfile } from '@/lib/userProfile';
import restaurants from '@/data/restaurants.json';

type Group = {
  id: string;
  name: string;
  restaurantName?: string;
  diningTime?: string;
  memberIds: string[];
};

export default function GroupListPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [avatarsByGroup, setAvatarsByGroup] = useState<Record<string, string[]>>({});
  const [tagsByGroup, setTagsByGroup] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadGroups(uid: string) {
      setLoading(true);
      try {
        const groupsRef = collection(db, 'groups');
        const q = query(groupsRef, where('memberIds', 'array-contains', uid));
        const snap = await getDocs(q);

        const data: Group[] = snap.docs.map((doc) => {
          const d = doc.data() as { name?: string; memberIds?: string[]; restaurantName?: string; diningTime?: string };
          return {
            id: doc.id,
            name: d.name ?? doc.id,
            restaurantName: d.restaurantName,
            diningTime: d.diningTime,
            memberIds: Array.isArray(d.memberIds) ? d.memberIds : [],
          };
        });

        setGroups(data);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadGroups(user.uid);
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      const next: Record<string, string[]> = {};
      for (const g of groups) {
        const ids = g.memberIds.slice(0, 3);
        const urls: string[] = [];
        for (const id of ids) {
          try {
            const p = await getUserProfile(id);
            urls.push(p?.avatarUrl || '/icon.png');
          } catch {
            urls.push('/icon.png');
          }
        }
        next[g.id] = urls;
      }
      setAvatarsByGroup(next);
    })();
  }, [groups]);

  useEffect(() => {
    const next: Record<string, string[]> = {};
    for (const g of groups) {
      if (g.restaurantName) {
        const r = (restaurants as Array<{ name: string; tags?: string[]; foodTypes?: string[] }>).find(
          (x) => x.name.toLowerCase() === g.restaurantName!.toLowerCase()
        );
        const tags = (r?.tags && r.tags.length ? r.tags : r?.foodTypes) || [];
        next[g.id] = tags.slice(0, 5);
      }
    }
    setTagsByGroup(next);
  }, [groups]);

  function formatDiningTime(t?: string): string {
    if (!t) return 'N/A';
    const d = new Date(t);
    if (isNaN(d.getTime())) return 'N/A';
    const days = ['Sun','Mon','Tues','Wed','Thurs','Fri','Sat'];
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${days[d.getDay()]} ${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }

  if (!user) {
    return <div className="max-w-2xl mx-auto p-4">Please sign in to view your groups.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">← Back</Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Your Groups</h1>
          <button
            className="text-xs border rounded px-2 py-1 hover:bg-muted"
            onClick={async () => {
              const name = prompt('Group name');
              if (!name || !user) return;
              try {
                const id = await createGroup(name, user.uid);
                location.href = `/groups/${id}`;
              } catch (e) {
                console.error('Create group failed', e);
                alert('Could not create group');
              }
            }}
          >
            + Create
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading groups…</div>
      ) : groups.length === 0 ? (
        <div className="text-sm text-muted-foreground">You don&apos;t have any groups yet.</div>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{group.name}</span>
                  <span className="text-xs text-muted-foreground">🍴 {group.restaurantName || 'Not chosen yet'} · 🕙 {formatDiningTime(group.diningTime)} · 🧑‍🤝‍🧑 {group.memberIds.length}</span>
                  {group.restaurantName ? (
                    <div className="mt-1 flex gap-1 flex-wrap">
                      {(tagsByGroup[group.id] || []).length ? (
                        (tagsByGroup[group.id] || []).map((t, i) => (
                          <span key={i} className="text-[10px] border rounded px-2 py-0.5">
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Tags: N/A</span>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {(avatarsByGroup[group.id] || []).slice(0, 3).map((src, i) => (
                      <Image key={i} src={src} alt="member" width={24} height={24} className="rounded-full object-cover ring-2 ring-white dark:ring-gray-800" />
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}