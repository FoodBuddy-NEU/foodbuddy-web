// /Users/yachenwang/Desktop/Foodbuddy-Web/foodbuddy-web/src/lib/chat.ts
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs, where } from 'firebase/firestore';
import type { FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import type { ChatMessage } from '@/types/chatType';

type SendTextMessageParams = {
  groupId: string;
  senderId: string;
  text: string;
};

export async function sendTextMessage({ groupId, senderId, text }: SendTextMessageParams): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  await addDoc(messagesRef, {
    groupId,
    senderId,
    type: 'text',
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}

export function subscribeGroupMessages(groupId: string, callback: (messages: ChatMessage[]) => void): () => void {
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  const unsubscribe = onSnapshot(
    q,
    {
      next: (snapshot) => {
        const messages: ChatMessage[] = snapshot.docs.map((doc) => {
          const data = doc.data() as Omit<ChatMessage, 'id'>;
          return { id: doc.id, ...data };
        });
        callback(messages);
      },
      error: (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          // Common when user signs out while a listener is active; safe to ignore.
          console.info('Group messages listener removed due to permission change');
          callback([]);
        } else {
          console.error('Group messages listener error', err);
        }
      },
    }
  );
  return unsubscribe;
}

export async function createGroup(name: string, ownerId: string): Promise<string> {
  const groupsRef = collection(db, 'groups');
  const docRef = await addDoc(groupsRef, {
    name: name.trim() || 'Untitled',
    ownerId,
    memberIds: [ownerId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function addGroupMember(groupId: string, uid: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { memberIds: arrayUnion(uid), updatedAt: serverTimestamp() });
}

export async function removeGroupMember(groupId: string, uid: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { memberIds: arrayRemove(uid), updatedAt: serverTimestamp() });
}

export async function disbandGroup(groupId: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  // Delete messages first so no subcollection docs remain; many providers
  // require explicit cleanup of subcollections, and rules often reference
  // the parent doc for membership checks, which would deny access once deleted.
  const snap = await getDocs(messagesRef);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  // Finally delete the group document
  await deleteDoc(groupRef);
}

export function subscribeGroupMeta(
  groupId: string,
  cb: (data: { name?: string; ownerId?: string; memberIds?: string[]; diningTime?: string; restaurantId?: string; restaurantName?: string; preOrder?: PreOrderData }) => void
): () => void {
  const ref = doc(db, 'groups', groupId);
  return onSnapshot(
    ref,
    {
      next: (snap) => {
        cb(
          snap.exists()
            ? (snap.data() as {
                name?: string;
                ownerId?: string;
                memberIds?: string[];
                diningTime?: string;
                restaurantId?: string;
                restaurantName?: string;
                preOrder?: PreOrderData;
              })
            : {}
        );
      },
      error: (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          console.info('Group meta listener removed due to permission change');
          cb({});
        } else {
          console.error('Group meta listener error', err);
        }
      },
    }
  );
}

export async function updateGroupDiningTime(groupId: string, diningTime: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { diningTime, updatedAt: serverTimestamp() });
}

export async function updateGroupRestaurant(groupId: string, restaurantId: string, restaurantName: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { restaurantId, restaurantName, updatedAt: serverTimestamp() });
}

// PreOrder item type
export interface PreOrderItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // member userIds
  isCustom: boolean;
}

// PreOrder data structure
export interface PreOrderData {
  items: PreOrderItem[];
  tipPercent: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  memberCosts: Record<string, number>; // userId -> their share
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

export async function saveGroupPreOrder(
  groupId: string, 
  items: PreOrderItem[], 
  tipPercent: number, 
  taxRate: number
): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * taxRate;
  const tip = subtotal * (tipPercent / 100);
  const total = subtotal + tax + tip;

  // Calculate per-member costs
  const memberCosts: Record<string, number> = {};
  
  items.forEach(item => {
    if (item.assignedTo.length > 0) {
      const perPersonCost = item.price / item.assignedTo.length;
      item.assignedTo.forEach(memberId => {
        memberCosts[memberId] = (memberCosts[memberId] || 0) + perPersonCost;
      });
    }
  });

  // Add proportional tax and tip to each member
  Object.keys(memberCosts).forEach(memberId => {
    if (subtotal > 0) {
      const proportion = memberCosts[memberId] / subtotal;
      memberCosts[memberId] += (tax + tip) * proportion;
    }
  });

  const preOrderData: PreOrderData = {
    items,
    tipPercent,
    taxRate,
    subtotal,
    tax,
    tip,
    total,
    memberCosts,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(groupRef, { 
    preOrder: preOrderData,
    updatedAt: serverTimestamp() 
  });
}

export async function clearGroupPreOrder(groupId: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { 
    preOrder: null,
    updatedAt: serverTimestamp() 
  });
}

// Public Channel functions
const PUBLIC_CHANNELS_COLLECTION = 'publicChannels';

export async function getOrCreatePublicChannel(channelName: string): Promise<string> {
  const channelsRef = collection(db, PUBLIC_CHANNELS_COLLECTION);
  const q = query(channelsRef, where('name', '==', channelName));
  const snap = await getDocs(q);
  
  if (snap.docs.length > 0) {
    return snap.docs[0].id;
  }
  
  // Create new public channel
  const docRef = await addDoc(channelsRef, {
    name: channelName,
    isPublic: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Helper that fetches a public channel id by name without creating it.
async function getPublicChannelIdByName(channelName: string): Promise<string | null> {
  const channelsRef = collection(db, PUBLIC_CHANNELS_COLLECTION);
  const q = query(channelsRef, where('name', '==', channelName));
  const snap = await getDocs(q);
  if (snap.docs.length === 0) return null;
  return snap.docs[0].id;
}

// Explicitly create or fetch a named public channel and record the creator
export async function createPublicChannel(name: string, creatorId: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Channel name is required');

  const channelId = await getOrCreatePublicChannel(trimmed);
  const channelRef = doc(db, PUBLIC_CHANNELS_COLLECTION, channelId);

  // Record who created it and add them as a participant for easier discovery
  await updateDoc(channelRef, {
    createdBy: creatorId,
    participantIds: arrayUnion(creatorId),
    updatedAt: serverTimestamp(),
  });

  return channelId;
}

export function subscribePublicChannelMessages(channelName: string, callback: (messages: ChatMessage[]) => void): () => void {
  let innerUnsub: (() => void) | null = null;
  let cancelled = false;

  // First listen for the channel doc by name so we can get its id
  const channelsRef = collection(db, PUBLIC_CHANNELS_COLLECTION);
  const qChannels = query(channelsRef, where('name', '==', channelName));

  const outerUnsub = onSnapshot(
    qChannels,
    {
      next: (snapshot) => {
        if (cancelled) return;

        if (snapshot.docs.length === 0) {
          callback([]);
          return;
        }

        const channelId = snapshot.docs[0].id;

        // Tear down any existing inner listener before creating a new one
        innerUnsub?.();

        const channelMessagesRef = collection(db, PUBLIC_CHANNELS_COLLECTION, channelId, 'messages');
        const msgsQuery = query(channelMessagesRef, orderBy('createdAt', 'asc'));

        innerUnsub = onSnapshot(
          msgsQuery,
          {
            next: (msgsSnapshot) => {
              const messages: ChatMessage[] = msgsSnapshot.docs.map((doc) => {
                const data = doc.data() as Omit<ChatMessage, 'id'>;
                return { id: doc.id, ...data };
              });
              callback(messages);
            },
            error: (err: FirestoreError) => {
              if (err.code === 'permission-denied') {
                console.info('Public channel messages listener removed due to permission change');
                callback([]);
              } else {
                console.error('Public channel messages listener error', err);
              }
            },
          }
        );
      },
      error: (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          console.info('Public channel lookup listener removed due to permission change');
          callback([]);
        } else {
          console.error('Public channel lookup listener error', err);
        }
      },
    }
  );

  return () => {
    cancelled = true;
    outerUnsub();
    innerUnsub?.();
  };
}

export async function sendPublicChannelMessage(channelName: string, senderId: string, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const channelId = await getOrCreatePublicChannel(channelName);
  const messagesRef = collection(db, PUBLIC_CHANNELS_COLLECTION, channelId, 'messages');
  const channelRef = doc(db, PUBLIC_CHANNELS_COLLECTION, channelId);

  await addDoc(messagesRef, {
    channelName,
    senderId,
    type: 'text',
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  // Track participants for surfacing public channels in the "Your Groups" tab
  await updateDoc(channelRef, {
    participantIds: arrayUnion(senderId),
    updatedAt: serverTimestamp(),
  });
}

// Public channel dining events
export async function createPublicChannelEvent(
  channelName: string,
  params: { creatorId: string; restaurantId: string; restaurantName: string; diningTime: string }
): Promise<void> {
  const { creatorId, restaurantId, restaurantName, diningTime } = params;
  const channelId = await getOrCreatePublicChannel(channelName);
  const eventsRef = collection(db, PUBLIC_CHANNELS_COLLECTION, channelId, 'events');
  const channelRef = doc(db, PUBLIC_CHANNELS_COLLECTION, channelId);

  await addDoc(eventsRef, {
    channelName,
    creatorId,
    restaurantId,
    restaurantName,
    diningTime, // ISO string
    createdAt: serverTimestamp(),
  });

  // Ensure the creator is recorded as a participant
  await updateDoc(channelRef, {
    participantIds: arrayUnion(creatorId),
    updatedAt: serverTimestamp(),
  });
}

export function subscribePublicChannelEvents(
  channelName: string,
  callback: (events: Array<{ id: string; channelName?: string; creatorId: string; restaurantId: string; restaurantName: string; diningTime: string; createdAt?: unknown }>) => void
): () => void {
  let innerUnsub: (() => void) | null = null;
  let cancelled = false;

  const channelsRef = collection(db, PUBLIC_CHANNELS_COLLECTION);
  const qChannels = query(channelsRef, where('name', '==', channelName));

  const outerUnsub = onSnapshot(
    qChannels,
    {
      next: (snapshot) => {
        if (cancelled) return;

        if (snapshot.docs.length === 0) {
          callback([]);
          return;
        }

        const channelId = snapshot.docs[0].id;

        innerUnsub?.();

        const eventsRef = collection(db, PUBLIC_CHANNELS_COLLECTION, channelId, 'events');
        const qEvents = query(eventsRef, orderBy('diningTime', 'asc'));

        innerUnsub = onSnapshot(
          qEvents,
          {
            next: (eventsSnap) => {
              const events = eventsSnap.docs.map((docSnap) => {
                const data = docSnap.data() as {
                  channelName?: string;
                  creatorId: string;
                  restaurantId: string;
                  restaurantName: string;
                  diningTime: string;
                  createdAt?: unknown;
                };
                return { id: docSnap.id, ...data };
              });
              callback(events);
            },
            error: (err: FirestoreError) => {
              if (err.code === 'permission-denied') {
                console.info('Public channel events listener removed due to permission change');
                callback([]);
              } else {
                console.error('Public channel events listener error', err);
              }
            },
          }
        );
      },
      error: (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          console.info('Public channel events lookup listener removed due to permission change');
          callback([]);
        } else {
          console.error('Public channel events lookup listener error', err);
        }
      },
    }
  );

  return () => {
    cancelled = true;
    outerUnsub();
    innerUnsub?.();
  };
}

// Disband a public channel (creator-only via security rules)
export async function disbandPublicChannel(channelName: string): Promise<void> {
  const channelId = await getPublicChannelIdByName(channelName);
  if (!channelId) {
    throw new Error('Channel not found');
  }

  const channelRef = doc(db, PUBLIC_CHANNELS_COLLECTION, channelId);
  const messagesRef = collection(db, PUBLIC_CHANNELS_COLLECTION, channelId, 'messages');
  const eventsRef = collection(db, PUBLIC_CHANNELS_COLLECTION, channelId, 'events');

  const [messagesSnap, eventsSnap] = await Promise.all([
    getDocs(messagesRef),
    getDocs(eventsRef),
  ]);

  await Promise.all([
    ...messagesSnap.docs.map((d) => deleteDoc(d.ref)),
    ...eventsSnap.docs.map((d) => deleteDoc(d.ref)),
  ]);

  await deleteDoc(channelRef);
}

// Cancel a single dining event in a public channel
export async function cancelPublicChannelEvent(channelName: string, eventId: string): Promise<void> {
  const channelId = await getPublicChannelIdByName(channelName);
  if (!channelId) {
    throw new Error('Channel not found');
  }

  const eventRef = doc(db, PUBLIC_CHANNELS_COLLECTION, channelId, 'events', eventId);
  await deleteDoc(eventRef);
}
