// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/app/groups/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useAuth } from '@/lib/AuthProvider';

type Group = {
  id: string;
  name: string;
};

export default function GroupListPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadGroups() {
      setLoading(true);
      try {
        const groupsRef = collection(db, 'groups');
        const q = query(groupsRef, orderBy('name', 'asc'));
        const snap = await getDocs(q);

        const data: Group[] = snap.docs.map((doc) => {
          const d = doc.data() as { name?: string };
          return {
            id: doc.id,
            name: d.name ?? doc.id,
          };
        });

        setGroups(data);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [user]);

  if (!user) {
    return <div className="max-w-2xl mx-auto p-4">Please sign in to view your groups.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">← Back</Link>
        <h1 className="text-xl font-semibold">Your Groups</h1>
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
                <span className="font-medium">{group.name}</span>
                <span className="text-xs text-muted-foreground">Enter chat →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}