// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/app/groups/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { createGroup } from '@/lib/chat';

type Group = {
  id: string;
  name: string;
  diningTime?: string;
  restaurantName?: string;
};

export default function GroupListPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState('Any Restaurant');
  const [timeFilter, setTimeFilter] = useState<'any' | 'has' | 'no' | 'match'>('any');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterTime, setFilterTime] = useState<string>('12:00');
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
          const d = doc.data() as { name?: string; diningTime?: string; restaurantName?: string };
          return {
            id: doc.id,
            name: d.name ?? doc.id,
            diningTime: d.diningTime,
            restaurantName: d.restaurantName,
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

  if (!user) {
    return <div className="max-w-2xl mx-auto p-4">Please sign in to view your groups.</div>;
  }

  const restaurants = Array.from(new Set(groups.map((g) => g.restaurantName).filter(Boolean)));

  // Get today's date in YYYY-MM-DD format for min date
  const todayStr = new Date().toISOString().split('T')[0];

  // Generate time slot options (30-minute intervals)
  const timeSlotOptions = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = (i % 2) * 30;
    const hour = h.toString().padStart(2, '0');
    const minute = m.toString().padStart(2, '0');
    const value = `${hour}:${minute}`;
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? 'AM' : 'PM';
    const label = `${displayHour}:${minute.padStart(2, '0')} ${ampm}`;
    return { value, label };
  });

  const filteredGroups = groups.filter((g) => {
    const q = searchQuery.trim().toLowerCase();
    if (q && !g.name.toLowerCase().includes(q)) return false;

    if (restaurantFilter && restaurantFilter !== 'Any Restaurant') {
      if (restaurantFilter === 'No Restaurant') {
        if (g.restaurantName) return false;
      } else {
        if (g.restaurantName !== restaurantFilter) return false;
      }
    }

    if (timeFilter === 'has' && !g.diningTime) return false;
    if (timeFilter === 'no' && g.diningTime) return false;
    if (timeFilter === 'match' && filterDate) {
      // Parse the group's dining time
      if (!g.diningTime) return false;
      const groupDate = g.diningTime.split('T')[0];
      // If both date and time are set, match both
      if (filterTime && filterTime !== '12:00') {
        const groupTime = g.diningTime.split('T')[1]?.substring(0, 5);
        return groupDate === filterDate && groupTime === filterTime;
      }
      // Otherwise, match date only
      return groupDate === filterDate;
    }

    return true;
  });

  // Format dining time from ISO string to readable format
  const formatDiningTime = (isoString?: string): string | null => {
    if (!isoString) return null;
    try {
      const dt = new Date(isoString);
      const h = dt.getHours();
      const m = dt.getMinutes();
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return null;
    }
  };

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

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups by name"
            className="flex-1 border rounded px-3 py-2"
          />

          <select
            value={restaurantFilter}
            onChange={(e) => setRestaurantFilter(e.target.value)}
            className="border rounded px-2 py-2"
          >
            <option>Any Restaurant</option>
            {restaurants.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
            <option value="No Restaurant">No Restaurant</option>
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="border rounded px-2 py-2"
          >
            <option value="any">Any time</option>
            <option value="match">Match time</option>
            <option value="has">Has time</option>
            <option value="no">No time</option>
          </select>
        </div>

        {timeFilter === 'match' && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                lang="en-US"
                value={filterDate}
                min={todayStr}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">Time</label>
              <select
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                className="w-full border rounded px-2 py-2"
              >
                {timeSlotOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading groups…</div>
      ) : groups.length === 0 ? (
        <div className="text-sm text-muted-foreground">You don&apos;t have any groups yet.</div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-sm text-muted-foreground">No groups match your search or filters.</div>
      ) : (
        <ul className="space-y-2">
          {filteredGroups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted text-sm"
              >
                <div>
                  <div className="font-medium">{group.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {group.restaurantName ? `${group.restaurantName}` : 'No restaurant'}
                    {group.diningTime ? ` • ${formatDiningTime(group.diningTime)}` : ''}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Enter chat →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
