'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import UserProfileModal from '@/components/UserProfileModal';
import {
  subscribeIncomingFriendRequests,
  subscribeFriendsList,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  checkFriendshipStatus,
} from '@/lib/friends';
import { searchUsersByUsername, getUserProfile } from '@/lib/userProfile';
import type { FriendRequest } from '@/types/friendType';

// Convert Cloudinary HEIC URLs to JPG format for browser compatibility
function convertCloudinaryUrl(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  if (url.toLowerCase().endsWith('.heic')) {
    return url.replace(/\.heic$/i, '.jpg');
  }
  if (url.includes('/upload/') && !url.includes('f_auto')) {
    return url.replace('/upload/', '/upload/f_auto/');
  }
  return url;
}

// Avatar component with error handling
function UserAvatar({ avatarUrl, username, size = 40 }: { avatarUrl?: string; username: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const processedUrl = avatarUrl ? convertCloudinaryUrl(avatarUrl) : undefined;

  if (!processedUrl || imgError) {
    return (
      <div
        className="rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {username?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <Image
      src={processedUrl}
      alt={username}
      width={size}
      height={size}
      className="rounded-full object-cover"
      onError={() => setImgError(true)}
    />
  );
}

export default function FriendsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, { username?: string; avatarUrl?: string }>>({});
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, { username?: string; avatarUrl?: string }>>({});

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ userId: string; username: string; avatarUrl?: string }>>([]);
  const [searchStatus, setSearchStatus] = useState<Record<string, 'none' | 'pending_sent' | 'pending_received' | 'friends'>>({});
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  // Processing state
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Profile modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Subscribe to incoming friend requests
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeIncomingFriendRequests(user.uid, setFriendRequests);
    return () => unsub();
  }, [user]);

  // Subscribe to friends list
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeFriendsList(user.uid, setFriendIds);
    return () => unsub();
  }, [user]);

  // Load profiles for friend requests
  useEffect(() => {
    const ids = friendRequests.map((r) => r.fromUserId).filter((id) => !requesterProfiles[id]);
    if (!ids.length) return;
    (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const p = await getUserProfile(id);
            return [id, p ? { username: p.username, avatarUrl: p.avatarUrl } : { username: id }] as const;
          } catch {
            return [id, { username: id }] as const;
          }
        })
      );
      setRequesterProfiles((prev) => {
        const next = { ...prev };
        for (const [id, val] of entries) next[id] = val;
        return next;
      });
    })();
  }, [friendRequests, requesterProfiles]);

  // Load profiles for friends
  useEffect(() => {
    const ids = friendIds.filter((id) => !friendProfiles[id]);
    if (!ids.length) return;
    (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const p = await getUserProfile(id);
            return [id, p ? { username: p.username, avatarUrl: p.avatarUrl } : { username: id }] as const;
          } catch {
            return [id, { username: id }] as const;
          }
        })
      );
      setFriendProfiles((prev) => {
        const next = { ...prev };
        for (const [id, val] of entries) next[id] = val;
        return next;
      });
    })();
  }, [friendIds, friendProfiles]);

  // Search users
  useEffect(() => {
    if (!user) return;
    const t = searchQuery.trim().toLowerCase();
    if (t.length < 2) {
      setSearchResults([]);
      return;
    }
    let active = true;
    (async () => {
      const results = await searchUsersByUsername(t, 10);
      if (active) {
        // Filter out current user
        setSearchResults(results.filter((u) => u.userId !== user.uid));
      }
    })();
    return () => {
      active = false;
    };
  }, [searchQuery, user]);

  // Check friendship status for search results
  // Re-check when friendIds changes (e.g., after removing a friend)
  const friendIdsKey = friendIds.join(',');
  useEffect(() => {
    if (!user || searchResults.length === 0) return;
    (async () => {
      const statuses: Record<string, 'none' | 'pending_sent' | 'pending_received' | 'friends'> = {};
      await Promise.all(
        searchResults.map(async (u) => {
          statuses[u.userId] = await checkFriendshipStatus(user.uid, u.userId);
        })
      );
      setSearchStatus(statuses);
    })();
  }, [searchResults, user, friendIdsKey]);

  // Handle accept request
  async function handleAccept(request: FriendRequest) {
    setProcessingRequest(request.id);
    try {
      await acceptFriendRequest(request.id, request.fromUserId, request.toUserId);
    } catch (e) {
      console.error('Accept failed', e);
      alert('Failed to accept request');
    } finally {
      setProcessingRequest(null);
    }
  }

  // Handle reject request
  async function handleReject(request: FriendRequest) {
    setProcessingRequest(request.id);
    try {
      await rejectFriendRequest(request.id);
    } catch (e) {
      console.error('Reject failed', e);
      alert('Failed to reject request');
    } finally {
      setProcessingRequest(null);
    }
  }

  // Handle send friend request
  async function handleSendRequest(toUserId: string) {
    if (!user) return;
    setSendingTo(toUserId);
    try {
      await sendFriendRequest(user.uid, toUserId);
      setSearchStatus((prev) => ({ ...prev, [toUserId]: 'pending_sent' }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send request';
      if (msg.includes('auto-accepted')) {
        setSearchStatus((prev) => ({ ...prev, [toUserId]: 'friends' }));
        alert('You are now friends!');
      } else if (msg.includes('Already friends')) {
        setSearchStatus((prev) => ({ ...prev, [toUserId]: 'friends' }));
      } else if (msg.includes('already sent')) {
        setSearchStatus((prev) => ({ ...prev, [toUserId]: 'pending_sent' }));
      } else {
        alert(msg);
      }
    } finally {
      setSendingTo(null);
    }
  }

  // Handle remove friend
  async function handleRemoveFriend(friendId: string) {
    if (!user) return;
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await removeFriend(user.uid, friendId);
    } catch (e) {
      console.error('Remove friend failed', e);
      alert('Failed to remove friend');
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Friends</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Back to Home
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`tab-btn px-4 py-2 font-medium ${activeTab === 'friends' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('friends')}
        >
          My Friends ({friendIds.length})
        </button>
        <button
          className={`tab-btn px-4 py-2 font-medium relative ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests
          {friendRequests.length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {friendRequests.length}
            </span>
          )}
        </button>
        <button
          className={`tab-btn px-4 py-2 font-medium ${activeTab === 'add' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('add')}
        >
          Add Friend
        </button>
      </div>

      {/* Friends List Tab */}
      {activeTab === 'friends' && (
        <div>
          {friendIds.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>You don&apos;t have any friends yet.</p>
              <button
                className="mt-2 text-blue-500 hover:underline"
                onClick={() => setActiveTab('add')}
              >
                Add some friends!
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {friendIds.map((id) => {
                const p = friendProfiles[id];
                const name = p?.username || id;
                return (
                  <li key={id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserAvatar avatarUrl={p?.avatarUrl} username={name} />
                      <button
                        className="username-link font-medium text-left hover:underline border-none cursor-pointer p-0"
                        style={{ background: 'transparent' }}
                        onClick={() => {
                          setSelectedUserId(id);
                          setShowProfileModal(true);
                        }}
                      >
                        {name}
                      </button>
                    </div>
                    <button
                      className="text-xs text-red-500 border border-red-500 rounded px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleRemoveFriend(id)}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Friend Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {friendRequests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No pending friend requests.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {friendRequests.map((req) => {
                const p = requesterProfiles[req.fromUserId];
                const name = p?.username || req.fromUserId;
                const isProcessing = processingRequest === req.id;
                return (
                  <li key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserAvatar avatarUrl={p?.avatarUrl} username={name} />
                      <div>
                        <button
                          className="username-link font-medium text-left hover:underline border-none cursor-pointer p-0"
                          style={{ background: 'transparent' }}
                          onClick={() => {
                            setSelectedUserId(req.fromUserId);
                            setShowProfileModal(true);
                          }}
                        >
                          {name}
                        </button>
                        <p className="text-xs text-muted-foreground">wants to be your friend</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="text-xs bg-green-500 text-white rounded px-3 py-1 hover:bg-green-600 disabled:opacity-50"
                        onClick={() => handleAccept(req)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '...' : 'Accept'}
                      </button>
                      <button
                        className="text-xs border border-gray-300 rounded px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                        onClick={() => handleReject(req)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '...' : 'Decline'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Add Friend Tab */}
      {activeTab === 'add' && (
        <div>
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-1">Type at least 2 characters to search</p>
          </div>

          {searchResults.length > 0 ? (
            <ul className="space-y-3">
              {searchResults.map((u) => {
                const status = searchStatus[u.userId];
                const isSending = sendingTo === u.userId;
                return (
                  <li key={u.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserAvatar avatarUrl={u.avatarUrl} username={u.username} />
                      <button
                        className="username-link font-medium text-left hover:underline border-none cursor-pointer p-0"
                        style={{ background: 'transparent' }}
                        onClick={() => {
                          setSelectedUserId(u.userId);
                          setShowProfileModal(true);
                        }}
                      >
                        {u.username}
                      </button>
                    </div>
                    {status === 'friends' ? (
                      <span className="text-xs text-green-500 font-medium">✓ Friends</span>
                    ) : status === 'pending_sent' ? (
                      <span className="text-xs text-yellow-600 font-medium">Request Sent</span>
                    ) : status === 'pending_received' ? (
                      <button
                        className="text-xs bg-green-500 text-white rounded px-3 py-1 hover:bg-green-600"
                        onClick={() => setActiveTab('requests')}
                      >
                        View Request
                      </button>
                    ) : (
                      <button
                        className="text-xs bg-blue-500 text-white rounded px-3 py-1 hover:bg-blue-600 disabled:opacity-50"
                        onClick={() => handleSendRequest(u.userId)}
                        disabled={isSending}
                      >
                        {isSending ? 'Sending...' : 'Add Friend'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No users found matching &quot;{searchQuery}&quot;</p>
            </div>
          ) : null}
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
}
