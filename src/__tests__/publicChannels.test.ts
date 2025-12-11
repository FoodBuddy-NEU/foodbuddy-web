import {
  createPublicChannel,
  disbandPublicChannel,
  cancelPublicChannelEvent,
} from '@/lib/chat';

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

// Mock Firestore client
jest.mock('@/lib/firebaseClient', () => ({
  db: {},
}));

// Mock Firestore SDK functions used by chat helpers
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((...args) => ({ collectionPath: args })),
  query: jest.fn((ref) => ({ q: ref })),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn((...args) => ({ docPath: args })),
  serverTimestamp: jest.fn(() => ({ seconds: 123 })),
  arrayUnion: jest.fn((...values: unknown[]) => ({ values })),
  arrayRemove: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
}));

describe('Public channel helpers', () => {
  const mockCreatorId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createPublicChannel reuses an existing channel instead of creating a duplicate', async () => {
    // getOrCreatePublicChannel will see one existing doc and not call addDoc
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ id: 'existing-channel-id' }],
    });

    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    const id = await createPublicChannel('Data Science', mockCreatorId);

    expect(id).toBe('existing-channel-id');
    // No new document should be created when the name already exists
    expect(addDoc).not.toHaveBeenCalled();
    // But we still record creator info on the existing doc
    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ createdBy: mockCreatorId })
    );
  });

  it('createPublicChannel creates a new channel when none exists', async () => {
    // First call (for existing channels) returns no docs
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });

    // addDoc is then used to create the channel
    (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'new-channel-id' });
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    const id = await createPublicChannel('New Topic', mockCreatorId);

    expect(id).toBe('new-channel-id');
    expect(addDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ createdBy: mockCreatorId })
    );
  });

  it('disbandPublicChannel deletes all messages, events, and the channel doc', async () => {
    // First getDocs call: find channel by name
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ id: 'channel-1' }],
    });

    // Second + third getDocs: messages and events under that channel
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [
        { ref: { id: 'msg-1' } },
        { ref: { id: 'msg-2' } },
      ],
    });
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ ref: { id: 'event-1' } }],
    });

    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    await disbandPublicChannel('Cybersecurity');

    // Expect deleteDoc for each message, each event, and the channel doc itself
    expect(deleteDoc).toHaveBeenCalled();
    const deleteCalls = (deleteDoc as jest.Mock).mock.calls.length;
    expect(deleteCalls).toBeGreaterThanOrEqual(3);
  });

  it('cancelPublicChannelEvent deletes a single event document', async () => {
    // Resolve channel id by name
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ id: 'channel-2' }],
    });

    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    await cancelPublicChannelEvent('Data Science', 'event-123');

    expect(deleteDoc).toHaveBeenCalledTimes(1);
    const [[refArg]] = (deleteDoc as jest.Mock).mock.calls;
    // The exact ref object is mocked; we just assert something was passed
    expect(refArg).toBeDefined();
  });
});
