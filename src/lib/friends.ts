// Friend-related Firestore operations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import type { FriendRequest } from '@/types/friendType';

const FRIEND_REQUESTS_COLLECTION = 'friendRequests';

// Send a friend request
export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<string> {
  // First check if actually friends (in case old accepted request exists but friendship was removed)
  const friends = await getFriendsList(fromUserId);
  if (friends.includes(toUserId)) {
    throw new Error('Already friends');
  }

  // Check if request already exists
  const existingRequest = await getExistingRequest(fromUserId, toUserId);
  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      throw new Error('Friend request already sent');
    }
    // If accepted or rejected, allow re-sending by updating the existing request
    // (accepted but not in friends list means they were unfriended)
    await updateDoc(doc(db, FRIEND_REQUESTS_COLLECTION, existingRequest.id), {
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return existingRequest.id;
  }

  // Check if reverse request exists (they sent you a request)
  const reverseRequest = await getExistingRequest(toUserId, fromUserId);
  if (reverseRequest && reverseRequest.status === 'pending') {
    // Auto-accept: they already sent you a request
    await acceptFriendRequest(reverseRequest.id, toUserId, fromUserId);
    throw new Error('Request auto-accepted: they already sent you a request');
  }

  const docRef = await addDoc(collection(db, FRIEND_REQUESTS_COLLECTION), {
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Get existing request between two users (in one direction)
async function getExistingRequest(fromUserId: string, toUserId: string): Promise<FriendRequest | null> {
  const q = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', toUserId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate() ?? null,
  } as FriendRequest;
}

// Get all pending friend requests for a user (incoming)
export async function getIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const q = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where('toUserId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() ?? null,
    }) as FriendRequest)
    .filter((req) => req.status === 'pending');
}

// Subscribe to incoming friend requests (real-time)
export function subscribeIncomingFriendRequests(
  userId: string,
  callback: (requests: FriendRequest[]) => void
): () => void {
  const q = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where('toUserId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() ?? null,
      }) as FriendRequest)
      .filter((req) => req.status === 'pending');
    callback(requests);
  });
}

// Get all outgoing pending friend requests
export async function getOutgoingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const q = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where('fromUserId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() ?? null,
    }) as FriendRequest)
    .filter((req) => req.status === 'pending');
}

// Accept a friend request
export async function acceptFriendRequest(
  requestId: string,
  fromUserId: string,
  toUserId: string
): Promise<void> {
  console.log('Accepting friend request:', { requestId, fromUserId, toUserId });
  
  // Update request status
  await updateDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId), {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });
  console.log('Request status updated to accepted');

  // Add each user to the other's friends list using setDoc with merge
  // This handles cases where the user document or friends field doesn't exist
  const fromUserRef = doc(db, 'users', fromUserId);
  const toUserRef = doc(db, 'users', toUserId);

  try {
    await setDoc(fromUserRef, {
      friends: arrayUnion(toUserId),
    }, { merge: true });
    console.log('Added', toUserId, 'to', fromUserId, 'friends list');
  } catch (e) {
    console.error('Failed to update fromUser friends:', e);
  }

  try {
    await setDoc(toUserRef, {
      friends: arrayUnion(fromUserId),
    }, { merge: true });
    console.log('Added', fromUserId, 'to', toUserId, 'friends list');
  } catch (e) {
    console.error('Failed to update toUser friends:', e);
  }
}

// Reject a friend request
export async function rejectFriendRequest(requestId: string): Promise<void> {
  await updateDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
}

// Cancel a sent friend request
export async function cancelFriendRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId));
}

// Remove a friend
export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const friendRef = doc(db, 'users', friendId);

  await updateDoc(userRef, {
    friends: arrayRemove(friendId),
  });
  await updateDoc(friendRef, {
    friends: arrayRemove(userId),
  });
}

// Get user's friends list
export async function getFriendsList(userId: string): Promise<string[]> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return [];
  const data = userSnap.data();
  return Array.isArray(data.friends) ? data.friends : [];
}

// Subscribe to user's friends list (real-time)
export function subscribeFriendsList(
  userId: string,
  callback: (friends: string[]) => void
): () => void {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snap) => {
    if (!snap.exists()) {
      console.log('User document does not exist for:', userId);
      callback([]);
      return;
    }
    const data = snap.data();
    console.log('Friends data for user:', userId, data.friends);
    callback(Array.isArray(data.friends) ? data.friends : []);
  }, (error) => {
    console.error('Error subscribing to friends list:', error);
    callback([]);
  });
}

// Check friendship status between two users
export async function checkFriendshipStatus(
  userId: string,
  otherUserId: string
): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends'> {
  // Check if already friends
  const friends = await getFriendsList(userId);
  if (friends.includes(otherUserId)) return 'friends';

  // Check if there's a pending request from current user
  const sentRequest = await getExistingRequest(userId, otherUserId);
  if (sentRequest && sentRequest.status === 'pending') return 'pending_sent';

  // Check if there's a pending request to current user
  const receivedRequest = await getExistingRequest(otherUserId, userId);
  if (receivedRequest && receivedRequest.status === 'pending') return 'pending_received';

  return 'none';
}
