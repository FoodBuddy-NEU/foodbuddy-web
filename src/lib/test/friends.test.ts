import {
  sendFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendsList,
  checkFriendshipStatus,
  subscribeIncomingFriendRequests,
  subscribeFriendsList,
} from '../friends';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => 'server-timestamp'),
  arrayUnion: jest.fn((val) => ({ arrayUnion: val })),
  arrayRemove: jest.fn((val) => ({ arrayRemove: val })),
}));

jest.mock('@/lib/firebaseClient', () => ({
  db: {},
}));

const firestore = jest.requireMock('firebase/firestore');

describe('friends library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for getDoc - returns empty friends list
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ friends: [] }),
    });
  });

  describe('sendFriendRequest', () => {
    test('creates new friend request when none exists', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: [] }),
      });
      firestore.getDocs.mockResolvedValue({ empty: true, docs: [] });
      firestore.addDoc.mockResolvedValue({ id: 'new-request-id' });

      const result = await sendFriendRequest('user1', 'user2');

      expect(result).toBe('new-request-id');
      expect(firestore.addDoc).toHaveBeenCalled();
    });

    test('throws error when pending request already exists', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: [] }),
      });
      firestore.getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'existing-req', data: () => ({ status: 'pending', fromUserId: 'user1', toUserId: 'user2' }) }],
      });

      await expect(sendFriendRequest('user1', 'user2')).rejects.toThrow('Friend request already sent');
    });

    test('throws error when already friends', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: ['user2'] }),
      });

      await expect(sendFriendRequest('user1', 'user2')).rejects.toThrow('Already friends');
    });

    test('updates existing rejected request to pending', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: [] }),
      });
      firestore.getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'rejected-req', data: () => ({ status: 'rejected', fromUserId: 'user1', toUserId: 'user2' }) }],
      });
      firestore.updateDoc.mockResolvedValue(undefined);

      const result = await sendFriendRequest('user1', 'user2');

      expect(result).toBe('rejected-req');
      expect(firestore.updateDoc).toHaveBeenCalled();
    });
  });

  describe('getIncomingFriendRequests', () => {
    test('returns pending friend requests', async () => {
      // Clear previous mocks and set up fresh
      firestore.getDocs.mockReset();
      firestore.getDocs.mockResolvedValue({
        docs: [
          { id: 'req1', data: () => ({ fromUserId: 'user2', toUserId: 'user1', status: 'pending', createdAt: { toDate: () => new Date() } }) },
        ],
      });

      const result = await getIncomingFriendRequests('user1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('req1');
    });
  });

  describe('getOutgoingFriendRequests', () => {
    test('returns pending outgoing requests', async () => {
      // Clear previous mocks and set up fresh
      firestore.getDocs.mockReset();
      firestore.getDocs.mockResolvedValue({
        docs: [
          { id: 'req1', data: () => ({ fromUserId: 'user1', toUserId: 'user2', status: 'pending', createdAt: { toDate: () => new Date() } }) },
        ],
      });

      const result = await getOutgoingFriendRequests('user1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('req1');
    });
  });

  describe('acceptFriendRequest', () => {
    test('updates request status and adds friends to both users', async () => {
      firestore.updateDoc.mockResolvedValue(undefined);
      firestore.setDoc.mockResolvedValue(undefined);

      await acceptFriendRequest('req1', 'user1', 'user2');

      expect(firestore.updateDoc).toHaveBeenCalled();
      expect(firestore.setDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('rejectFriendRequest', () => {
    test('updates request status to rejected', async () => {
      firestore.updateDoc.mockResolvedValue(undefined);

      await rejectFriendRequest('req1');

      expect(firestore.updateDoc).toHaveBeenCalled();
    });
  });

  describe('cancelFriendRequest', () => {
    test('deletes the request', async () => {
      firestore.deleteDoc.mockResolvedValue(undefined);

      await cancelFriendRequest('req1');

      expect(firestore.deleteDoc).toHaveBeenCalled();
    });
  });

  describe('removeFriend', () => {
    test('removes friend from both users', async () => {
      firestore.updateDoc.mockResolvedValue(undefined);

      await removeFriend('user1', 'user2');

      expect(firestore.updateDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('getFriendsList', () => {
    test('returns friends array from user document', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: ['user2', 'user3'] }),
      });

      const result = await getFriendsList('user1');

      expect(result).toEqual(['user2', 'user3']);
    });

    test('returns empty array when user does not exist', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getFriendsList('user1');

      expect(result).toEqual([]);
    });

    test('returns empty array when friends field is not an array', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: undefined }),
      });

      const result = await getFriendsList('user1');

      expect(result).toEqual([]);
    });
  });

  describe('checkFriendshipStatus', () => {
    test('returns friends when users are already friends', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: ['user2'] }),
      });

      const result = await checkFriendshipStatus('user1', 'user2');

      expect(result).toBe('friends');
    });

    test('returns pending_sent when request was sent', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: [] }),
      });
      // First getDocs call returns existing pending request from user1 to user2
      firestore.getDocs.mockResolvedValueOnce({
          empty: false,
          docs: [{ id: 'req1', data: () => ({ status: 'pending', fromUserId: 'user1', toUserId: 'user2' }) }],
        });

      const result = await checkFriendshipStatus('user1', 'user2');

      expect(result).toBe('pending_sent');
    });

    test('returns pending_received when request was received', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: [] }),
      });
      firestore.getDocs
        .mockResolvedValueOnce({ empty: true, docs: [] })
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: 'req1', data: () => ({ status: 'pending', fromUserId: 'user2', toUserId: 'user1' }) }],
        });

      const result = await checkFriendshipStatus('user1', 'user2');

      expect(result).toBe('pending_received');
    });

    test('returns none when no relationship exists', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ friends: [] }),
      });
      firestore.getDocs.mockResolvedValue({ empty: true, docs: [] });

      const result = await checkFriendshipStatus('user1', 'user2');

      expect(result).toBe('none');
    });
  });

  describe('subscribeIncomingFriendRequests', () => {
    test('calls callback with pending requests', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      firestore.onSnapshot.mockImplementation((_query: unknown, cb: (snap: unknown) => void) => {
        cb({
          docs: [
            { id: 'req1', data: () => ({ fromUserId: 'user2', toUserId: 'user1', status: 'pending', createdAt: { toDate: () => new Date() } }) },
          ],
        });
        return mockUnsubscribe;
      });

      const unsub = subscribeIncomingFriendRequests('user1', callback);

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0]).toHaveLength(1);
      expect(typeof unsub).toBe('function');
    });
  });

  describe('subscribeFriendsList', () => {
    test('calls callback with friends array', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      firestore.onSnapshot.mockImplementation((_ref: unknown, successCb: (snap: unknown) => void) => {
        successCb({
          exists: () => true,
          data: () => ({ friends: ['user2', 'user3'] }),
        });
        return mockUnsubscribe;
      });

      const unsub = subscribeFriendsList('user1', callback);

      expect(callback).toHaveBeenCalledWith(['user2', 'user3']);
      expect(typeof unsub).toBe('function');
    });

    test('calls callback with empty array when user does not exist', () => {
      const callback = jest.fn();
      
      firestore.onSnapshot.mockImplementation((_ref: unknown, successCb: (snap: unknown) => void) => {
        successCb({
          exists: () => false,
        });
        return jest.fn();
      });

      subscribeFriendsList('user1', callback);

      expect(callback).toHaveBeenCalledWith([]);
    });
  });
});
