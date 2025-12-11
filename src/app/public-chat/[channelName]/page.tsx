'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ChatMessage } from '@/types/chatType';
import {
  subscribePublicChannelMessages,
  sendPublicChannelMessage,
  createPublicChannelEvent,
  subscribePublicChannelEvents,
  disbandPublicChannel,
  cancelPublicChannelEvent,
} from '@/lib/chat';
import { getUserProfile } from '@/lib/userProfile';
import { useAuth } from '@/lib/AuthProvider';
import { MessageBubble } from '@/components/MessageBubble';
import UserProfileModal from '@/components/UserProfileModal';
import restaurantsData from '@/data/restaurants.json';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

type Restaurant = {
  id: string;
  name: string;
  address: string;
  rating: number;
  priceRange: string;
};

export default function PublicChatPage() {
  const params = useParams<{ channelName: string }>();
  const channelName = decodeURIComponent(params.channelName);
  
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { username?: string; avatarUrl?: string }>>({});
  const [events, setEvents] = useState<
    Array<{
      id: string;
      channelName?: string;
      creatorId: string;
      restaurantId: string;
      restaurantName: string;
      diningTime: string;
    }>
  >([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const msgsUnsubRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dining event form state
  const [diningDate, setDiningDate] = useState<string>('');
  const [diningTimeSlot, setDiningTimeSlot] = useState<string>('');
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [channelCreatorId, setChannelCreatorId] = useState<string | null>(null);

  const restaurants = useMemo(() => restaurantsData as Restaurant[], []);

  const filteredRestaurants = useMemo(() => {
    const searchTerm = restaurantSearch.trim().toLowerCase();
    if (searchTerm.length < 2) return [];
    return restaurants
      .filter((r) => r.name.toLowerCase().includes(searchTerm))
      .slice(0, 8);
  }, [restaurantSearch, restaurants]);

  const todayStr = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  const timeSlotOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        const value = `${hour}:${minute}`;
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h < 12 ? 'AM' : 'PM';
        const label = `${displayHour}:${minute.padStart(2, '0')} ${ampm}`;
        options.push({ value, label });
      }
    }
    return options;
  }, []);

  // Load public channel metadata (creator) so we can allow disbanding
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const channelsRef = collection(db, 'publicChannels');
        const q = query(channelsRef, where('name', '==', channelName));
        const snap = await getDocs(q);
        if (cancelled) return;

        if (snap.empty) {
          setChannelCreatorId(null);
          return;
        }

        // Prefer a document that has a createdBy field
        let creator: string | null = null;
        for (const docSnap of snap.docs) {
          const data = docSnap.data() as { createdBy?: string };
          if (data.createdBy) {
            creator = data.createdBy;
            break;
          }
        }

        if (!creator) {
          const data = snap.docs[0].data() as { createdBy?: string };
          creator = data.createdBy ?? null;
        }

        setChannelCreatorId(creator);
      } catch (err) {
        console.error('Failed to load public channel metadata', err);
        setChannelCreatorId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channelName]);

  // Subscribe to messages
  useEffect(() => {
    msgsUnsubRef.current = subscribePublicChannelMessages(channelName, (msgs) => {
      setMessages(msgs);
    });

    return () => {
      msgsUnsubRef.current?.();
    };
  }, [channelName]);

  // Subscribe to dining events for this channel
  useEffect(() => {
    const unsub = subscribePublicChannelEvents(channelName, (evts) => {
      setEvents(evts);
    });
    return () => {
      unsub?.();
    };
  }, [channelName]);

  // Load user profiles (for message senders and event creators)
  useEffect(() => {
    (async () => {
      const uniqueSenderIds = Array.from(
        new Set([
          ...messages.map((m) => m.senderId),
          ...events.map((e) => e.creatorId),
        ])
      );
      for (const senderId of uniqueSenderIds) {
        if (profiles[senderId]) continue;
        try {
          const p = await getUserProfile(senderId);
          setProfiles((prev) => ({
            ...prev,
            [senderId]: p
              ? { username: p.username, avatarUrl: p.avatarUrl }
              : { username: 'Unknown User', avatarUrl: undefined },
          }));
        } catch {
          setProfiles((prev) => ({
            ...prev,
            [senderId]: { username: 'Unknown User', avatarUrl: undefined },
          }));
        }
      }
    })();
  }, [messages, events, profiles]);

  // Preload current user's profile
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!user || !text.trim()) return;
    try {
      await sendPublicChannelMessage(channelName, user.uid, text);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const handleDisbandChannel = async () => {
    if (!user) return;
    const confirmed = confirm(
      'This will delete this public channel and its events/messages for everyone. Continue?'
    );
    if (!confirmed) return;

    try {
      await disbandPublicChannel(channelName);
      location.href = '/public-chat';
    } catch (err) {
      console.error('Failed to disband public channel', err);
      alert('Failed to disband this public channel.');
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    if (!user) return;
    const confirmed = confirm('Cancel this event?');
    if (!confirmed) return;

    try {
      await cancelPublicChannelEvent(channelName, eventId);
    } catch (err) {
      console.error('Failed to cancel event', err);
      alert('Failed to cancel event.');
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto p-4">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p className="text-muted-foreground mb-4">Please sign in to view and post in public chat channels.</p>
        <Link href="/login" className="text-blue-500 hover:underline">Go to login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-80px)] flex flex-col border rounded-lg">
      {/* Header */}
      <header className="px-4 py-3 border-b flex items-center gap-3">
        <Link href="/groups" className="text-sm text-muted-foreground hover:underline">
          ← Back
        </Link>
        <div className="font-semibold">🌐 {channelName}</div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>Public Channel</span>
          <button
            className="border rounded px-2 py-1 text-xs hover:bg-muted"
            onClick={() => setShowEventForm((v) => !v)}
          >
            {showEventForm ? 'Close' : '🍽️ New Event'}
          </button>
        </div>
      </header>

      {/* Channel owner controls */}
      {user && channelCreatorId === user.uid && (
        <div className="px-4 py-2 border-b bg-red-50 text-xs flex items-center justify-between">
          <span>You created this public channel.</span>
          <button
            className="border rounded px-2 py-1 text-xs text-red-600 hover:bg-red-100"
            onClick={handleDisbandChannel}
          >
            Disband channel
          </button>
        </div>
      )}
      {/* Dining Events Summary */}
      {events.length > 0 && (
        <div className="px-4 py-2 border-b bg-blue-50 text-xs flex flex-col gap-1">
          <div className="font-medium text-[11px] text-blue-900 flex items-center gap-1">
            <span>🍽️ Upcoming meetups in this channel</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {events.map((evt) => {
              const d = new Date(evt.diningTime);
              const dateStr = isNaN(d.getTime())
                ? 'TBD'
                : d.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  });
              const creatorName =
                profiles[evt.creatorId]?.username || 'Unknown';
              return (
                <div
                  key={evt.id}
                  className="border rounded-full px-3 py-1 bg-white text-[11px] flex items-center gap-2"
                >
                  <span>📍 {evt.restaurantName}</span>
                  <span>• 🕒 {dateStr}</span>
                  <span>• by {creatorName}</span>
                  {user && evt.creatorId === user.uid && (
                    <button
                      className="ml-1 text-[10px] text-red-600 hover:underline"
                      onClick={() => handleCancelEvent(evt.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dining Event Creator */}
      {showEventForm && (
        <div className="border-b p-3 text-xs space-y-3 bg-white">
          <div className="font-medium flex items-center gap-2">
            <span>🍽️ Create a dining meetup</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                lang="en-US"
                value={diningDate}
                min={todayStr}
                onChange={(e) => setDiningDate(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-xs"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] text-muted-foreground mb-1">Time</label>
              <select
                value={diningTimeSlot}
                onChange={(e) => setDiningTimeSlot(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-xs"
              >
                <option value="">Select time...</option>
                {timeSlotOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-[11px] text-muted-foreground mb-1">Restaurant</label>
            <input
              value={restaurantSearch}
              onChange={(e) => setRestaurantSearch(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full border rounded px-2 py-1.5 text-xs"
            />
            {restaurantSearch.length >= 2 && filteredRestaurants.length > 0 && (
              <ul className="mt-1 border rounded max-h-40 overflow-y-auto bg-white divide-y">
                {filteredRestaurants.map((r) => (
                  <li
                    key={r.id}
                    className="px-2 py-1.5 text-xs cursor-pointer hover:bg-muted flex items-center justify-between"
                    onClick={() => {
                      setRestaurantId(r.id);
                      setRestaurantName(r.name);
                      setRestaurantSearch(r.name);
                    }}
                  >
                    <div>
                      <div className="font-medium text-xs">{r.name}</div>
                      <div className="text-[10px] text-muted-foreground">{r.address}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      ⭐ {r.rating} · {r.priceRange}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {restaurantSearch.length >= 2 && filteredRestaurants.length === 0 && (
              <div className="mt-1 text-[11px] text-muted-foreground">No restaurants found</div>
            )}
            {restaurantSearch.length > 0 && restaurantSearch.length < 2 && (
              <div className="mt-1 text-[11px] text-muted-foreground">Type at least 2 characters to search</div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              className="border rounded px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
              onClick={() => {
                setShowEventForm(false);
                setDiningDate('');
                setDiningTimeSlot('');
                setRestaurantId('');
                setRestaurantName('');
                setRestaurantSearch('');
              }}
            >
              Cancel
            </button>
            <button
              className="border rounded px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700"
              onClick={async () => {
                if (!user) return;
                if (!diningDate || !diningTimeSlot || !restaurantId || !restaurantName) {
                  alert('Please select date, time, and restaurant.');
                  return;
                }
                const isoTime = `${diningDate}T${diningTimeSlot}:00`;
                try {
                  await createPublicChannelEvent(channelName, {
                    creatorId: user.uid,
                    restaurantId,
                    restaurantName,
                    diningTime: new Date(isoTime).toISOString(),
                  });
                  setShowEventForm(false);
                  setDiningDate('');
                  setDiningTimeSlot('');
                  setRestaurantId('');
                  setRestaurantName('');
                  setRestaurantSearch('');
                } catch (err) {
                  console.error('Failed to create event', err);
                  alert('Failed to create event');
                }
              }}
            >
              Create Event
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/40">
        {messages.length === 0 ? (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            No messages yet in this channel. Be the first to say hi 👋
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              onClick={() => {
                if (m.senderId !== user.uid) {
                  setSelectedUserId(m.senderId);
                  setShowProfileModal(true);
                }
              }}
            >
              <MessageBubble
                message={m}
                isMe={m.senderId === user.uid}
                profile={profiles[m.senderId]}
              />
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput onSend={handleSendMessage} />

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

function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    await onSend(text);
    setText('');
  };

  return (
    <div className="border-t p-3 bg-background">
      <div className="flex gap-2">
        <input
          className="chat-input flex-1 border rounded-full px-3 py-2 text-sm"
          placeholder="Say something in this channel..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          className="chat-send-btn px-4 py-2 rounded-full border text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
