// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/app/group/[groupId]/page.tsx
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import type { ChatMessage } from '@/types/chatType';
import { subscribeGroupMessages, subscribeGroupMeta, addGroupMember, removeGroupMember, disbandGroup, updateGroupDiningTime, updateGroupRestaurant } from '@/lib/chat';
import { getUserProfile, searchUsersByUsername } from '@/lib/userProfile';
import { useAuth } from '@/lib/AuthProvider';
import { ChatInput } from '@/app/groups/chatInput';
import { MessageBubble } from '../../../components/MessageBubble';
import UserProfileModal from '@/components/UserProfileModal';
import restaurantsData from '@/data/restaurants.json';

type Restaurant = {
  id: string;
  name: string;
  address: string;
  rating: number;
  priceRange: string;
};

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
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined);
  const [showManage, setShowManage] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ userId: string; username: string; avatarUrl?: string }>>([]);
  const metaUnsubRef = useRef<(() => void) | null>(null);
  const msgsUnsubRef = useRef<(() => void) | null>(null);
  
  // User profile modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Dining settings state
  const [diningDate, setDiningDate] = useState<string>(''); // YYYY-MM-DD format
  const [diningTimeSlot, setDiningTimeSlot] = useState<string>(''); // HH:MM format
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [showDiningSettings, setShowDiningSettings] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  
  // Check if current user is the owner
  const isOwner = user?.uid === ownerId;
  
  // All restaurants from data
  const restaurants = useMemo(() => restaurantsData as Restaurant[], []);
  
  // Filtered restaurants based on search
  const filteredRestaurants = useMemo(() => {
    const searchTerm = restaurantSearch.trim().toLowerCase();
    if (searchTerm.length < 2) return [];
    return restaurants.filter(r => 
      r.name.toLowerCase().includes(searchTerm)
    ).slice(0, 8);
  }, [restaurantSearch, restaurants]);

  // Get today's date in YYYY-MM-DD format for min date
  const todayStr = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);
  
  // Generate time slot options (30-minute intervals)
  const timeSlotOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        const value = `${hour}:${minute}`;
        
        // Format for display (12-hour format)
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h < 12 ? 'AM' : 'PM';
        const label = `${displayHour}:${minute.padStart(2, '0')} ${ampm}`;
        
        options.push({ value, label });
      }
    }
    return options;
  }, []);
  
  // Combine date and time for display
  const formattedDiningDateTime = useMemo(() => {
    if (!diningDate) return null;
    const date = new Date(diningDate + 'T00:00:00');
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    if (!diningTimeSlot) return dateStr;
    
    const [h, m] = diningTimeSlot.split(':').map(Number);
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? 'AM' : 'PM';
    const timeStr = `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
    
    return `${dateStr}, ${timeStr}`;
  }, [diningDate, diningTimeSlot]);

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
      setOwnerId(typeof d.ownerId === 'string' ? d.ownerId : undefined);
      // Load dining settings - parse ISO string into date and time
      if (d.diningTime) {
        const dt = new Date(d.diningTime);
        setDiningDate(dt.toISOString().split('T')[0]);
        const hours = dt.getHours().toString().padStart(2, '0');
        const minutes = dt.getMinutes().toString().padStart(2, '0');
        setDiningTimeSlot(`${hours}:${minutes}`);
      }
      if (d.restaurantId) setRestaurantId(d.restaurantId);
      if (d.restaurantName) setRestaurantName(d.restaurantName);
    });
    metaUnsubRef.current = unsub;
    return () => unsub();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeGroupMessages(groupId, setMessages);
    msgsUnsubRef.current = unsubscribe;
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    const ids = Array.from(new Set([
      ...messages.map((m) => m.senderId),
      ...memberIds,
    ])).filter((id) => !profiles[id]);
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
  }, [messages, memberIds, profiles]);

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

  async function handleExitOrDisband() {
    try {
      // Unsubscribe listeners before changing membership or deleting the group.
      // Otherwise active snapshots will immediately fail under stricter rules
      // when the user loses access or the group doc disappears, spamming the console.
      metaUnsubRef.current?.();
      msgsUnsubRef.current?.();

      if (!user?.uid) return;
      if (user.uid === ownerId) {
        // Owners disband instead of exit. Confirm first; then delete messages
        // via server-side helpers and remove the group. This prevents orphaned
        // subcollection docs and enforces ownership semantics.
        const ok = confirm('Disband this group? This deletes all messages.');
        if (!ok) return;
        await disbandGroup(groupId);
        router.push('/groups');
      } else {
        // Regular members simply remove themselves from memberIds
        await removeGroupMember(groupId, user.uid);
        router.push('/groups');
      }
    } catch (e) {
      console.error('Exit/disband failed', e);
      alert('Operation failed');
    }
  }

  return (
    <div className="mx-auto max-w-2xl h-[calc(100vh-80px)] flex flex-col border rounded-lg">
      <header className="px-4 py-3 border-b flex items-center gap-3">
        <Link href="/groups" className="text-sm text-muted-foreground hover:underline">
          ← Back
        </Link>
        <div className="font-semibold">Group chat – {groupName ?? groupId}</div>
        <div className="ml-auto flex gap-2">
          <button
            className="text-xs border rounded px-2 py-1"
            onClick={() => setShowDiningSettings((v) => !v)}
          >
            {showDiningSettings ? 'Close' : '🍽️ Dining'}
          </button>
          <button
            className="text-xs border rounded px-2 py-1"
            onClick={() => setShowManage((v) => !v)}
          >
            {showManage ? 'Close' : 'Manage'}
          </button>
        </div>
      </header>

      {/* Current Dining Settings Display */}
      {(diningDate || restaurantName) && !showDiningSettings && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b text-sm flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>🕐</span>
            <span>{formattedDiningDateTime || 'Not set'}</span>
          </div>
          {restaurantName ? (
            <div className="flex items-center gap-1">
              <span>📍</span>
              <Link href={`/restaurants/${restaurantId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {restaurantName}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>📍</span>
              <span>Not set</span>
            </div>
          )}
        </div>
      )}

      {/* Dining Settings Panel */}
      {showDiningSettings && (
        <div className="border-b p-3 text-sm flex flex-col gap-4">
          <div className="text-md font-semibold text-muted-foreground">
            🍽️ Dining Settings
            {!isOwner && <span className="text-xs font-normal ml-2">(View only)</span>}
          </div>
          
          {/* Dining Date & Time */}
          <div>
            <label className="block text-sm font-medium mb-2">Dining Date & Time</label>
            
            {isOwner ? (
              <div className="flex gap-3">
                {/* Date Picker */}
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Date</label>
                  <input
                    type="date"
                    lang="en-US"
                    value={diningDate}
                    min={todayStr}
                    onChange={async (e) => {
                      const newDate = e.target.value;
                      setDiningDate(newDate);
                      if (newDate && diningTimeSlot) {
                        const isoTime = `${newDate}T${diningTimeSlot}:00`;
                        try {
                          await updateGroupDiningTime(groupId, new Date(isoTime).toISOString());
                        } catch (err) {
                          console.error('Failed to update dining time', err);
                        }
                      } else if (newDate) {
                        // Save date only with default time 12:00
                        const isoTime = `${newDate}T12:00:00`;
                        try {
                          await updateGroupDiningTime(groupId, new Date(isoTime).toISOString());
                        } catch (err) {
                          console.error('Failed to update dining time', err);
                        }
                      }
                    }}
                    className="w-full rounded border px-2 py-1.5"
                  />
                </div>
                
                {/* Time Picker */}
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Time</label>
                  <select
                    value={diningTimeSlot}
                    onChange={async (e) => {
                      const newTime = e.target.value;
                      setDiningTimeSlot(newTime);
                      if (diningDate && newTime) {
                        const isoTime = `${diningDate}T${newTime}:00`;
                        try {
                          await updateGroupDiningTime(groupId, new Date(isoTime).toISOString());
                        } catch (err) {
                          console.error('Failed to update dining time', err);
                        }
                      }
                    }}
                    className="w-full rounded border px-2 py-1.5"
                  >
                    <option value="">Select time...</option>
                    {timeSlotOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Clear Button */}
                {(diningDate || diningTimeSlot) && (
                  <button
                    className="self-end text-xs text-red-500 hover:underline px-2 py-1.5"
                    onClick={async () => {
                      setDiningDate('');
                      setDiningTimeSlot('');
                      try {
                        await updateGroupDiningTime(groupId, '');
                      } catch (err) {
                        console.error('Failed to clear dining time', err);
                      }
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            ) : (
              /* View-only mode for non-owners */
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                {formattedDiningDateTime || <span className="text-muted-foreground">Not specified</span>}
              </div>
            )}
          </div>
          
          {/* Restaurant */}
          <div>
            <label className="block text-sm font-medium mb-2">Restaurant</label>
            
            {isOwner ? (
              <>
                {restaurantName && (
                  <div className="dining-restaurant-selected mb-2 p-2 rounded border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <Link href={`/restaurants/${restaurantId}`} className="dining-restaurant-link hover:underline font-medium">
                        {restaurantName}
                      </Link>
                    </div>
                    <button
                      className="text-xs text-red-500 hover:underline"
                      onClick={async () => {
                        try {
                          await updateGroupRestaurant(groupId, '', '');
                          setRestaurantId('');
                          setRestaurantName('');
                        } catch (err) {
                          console.error('Failed to remove restaurant', err);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  value={restaurantSearch}
                  onChange={(e) => setRestaurantSearch(e.target.value)}
                  placeholder="Search restaurants by name..."
                  className="w-full rounded border px-2 py-1.5"
                />
                {filteredRestaurants.length > 0 && (
                  <ul className="mt-2 border rounded divide-y max-h-48 overflow-y-auto dining-restaurant-list">
                    {filteredRestaurants.map((r) => (
                      <li
                        key={r.id}
                        className="dining-restaurant-item p-2 cursor-pointer flex items-center justify-between"
                        onClick={async () => {
                          try {
                            await updateGroupRestaurant(groupId, r.id, r.name);
                            setRestaurantId(r.id);
                            setRestaurantName(r.name);
                            setRestaurantSearch('');
                          } catch (err) {
                            console.error('Failed to set restaurant', err);
                            alert('Failed to set restaurant');
                          }
                        }}
                      >
                        <div>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.address}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ⭐ {r.rating} · {r.priceRange}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {restaurantSearch.length >= 2 && filteredRestaurants.length === 0 && (
                  <div className="mt-2 text-muted-foreground text-sm">No restaurants found</div>
                )}
                {restaurantSearch.length > 0 && restaurantSearch.length < 2 && (
                  <div className="mt-2 text-muted-foreground text-sm">Type at least 2 characters to search</div>
                )}
              </>
            ) : (
              /* View-only mode for non-owners */
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                {restaurantName ? (
                  <Link href={`/restaurants/${restaurantId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {restaurantName}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Not specified</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showManage && (
        <div className="border-b p-3 text-sm flex flex-col gap-2">
          {memberIds.length > 0 && (
            <div>
              <div className="text-md font-semibold text-muted-foreground">Group Members</div>
              <ul className="space-y-1 mt-1 mb-3">
                {memberIds.map((id) => {
                  const p = profiles[id];
                  const name = p?.username || id;
                  return (
                    <li key={id} className="flex items-center gap-2">
                      <UserAvatar avatarUrl={p?.avatarUrl} username={name} />
                      <button
                        className="username-link hover:underline cursor-pointer"
                        style={{ background: 'transparent' }}
                        onClick={() => {
                          setSelectedUserId(id);
                          setShowProfileModal(true);
                        }}
                      >
                        {name}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {user && (memberIds.includes(user.uid) || user.uid === ownerId) ? (
                <button
                  className="text-xs text-red-500 border border-red-500 rounded px-2 py-1 mb-3"
                  onClick={handleExitOrDisband}
                >
                  {user?.uid === ownerId ? 'Disband Group' : 'Exit Group'}
                </button>
              ) : null}
              <div className="text-md font-semibold text-muted-foreground mb-2">Search More Members</div>
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search usernames…"
                  className="flex-1 rounded border px-2 py-1"
                />
              </div>
            </div>
          )}

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
          <div className="mt-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hi 👋
          </div>
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

      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedUserId || ''}
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
}