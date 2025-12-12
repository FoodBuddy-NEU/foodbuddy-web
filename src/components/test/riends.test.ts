import {
  sendFriendRequest,
  getIncomingFriendRequests,
  subscribeIncomingFriendRequests,
  getOutgoingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendsList,
  subscribeFriendsList,
  checkFriendshipStatus,
} from '@/lib/friends';

jest.mock('@/lib/firebaseClient', () => ({ db: {} }));

jest.mock('firebase/firestore', () => {
  const state = {
    requests: new Map<string, { id: string; fromUserId: string; toUserId: string; status: string; createdAt?: { toDate: () => Date } }>(),
    friends: new Map<string, Set<string>>(),
    errors: { friendsSnapshot: false },
  };

  const collection = jest.fn(() => ({}));
  const where = jest.fn((field: string, op: string, value: string) => ({ field, op, value }));
  const query = jest.fn((col: unknown, ...wheres: Array<{ field: string; op: string; value: string }>) => ({ col, wheres }));
  const doc = jest.fn((_db: unknown, col: string, id: string) => ({ __id: `${col}/${id}`, col, id }));
  const serverTimestamp = jest.fn(() => ({ toDate: () => new Date() }));
  const arrayUnion = jest.fn((v: string) => ({ op: 'union', v }));
  const arrayRemove = jest.fn((v: string) => ({ op: 'remove', v }));

  type TimestampLike = { toDate: () => Date };
  type RequestData = { __id?: string; fromUserId: string; toUserId: string; status: string; createdAt?: TimestampLike } & Record<string, unknown>;
  const addDoc = jest.fn(async (_colRef: unknown, data: RequestData) => {
    const id = data.__id ?? `req_${Math.random().toString(36).slice(2, 8)}`;
    state.requests.set(id, {
      id,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      status: data.status,
      createdAt: serverTimestamp() as TimestampLike,
    });
    return { id };
  });

  const updateDoc = jest.fn(async (ref: { __id: string }, updates: { friends?: { op?: string; v?: string } }) => {
    if (ref.__id.startsWith('friendRequests/')) {
      const id = ref.__id.split('/')[1];
      const req = state.requests.get(id);
      if (req) state.requests.set(id, { ...req, ...updates });
    } else if (ref.__id.startsWith('users/')) {
      const userId = ref.__id.split('/')[1];
      if (!state.friends.has(userId)) state.friends.set(userId, new Set());
      const set = state.friends.get(userId)!;
      if (updates.friends?.op === 'remove') {
        const v = updates.friends.v;
        if (typeof v === 'string') set.delete(v);
      }
    }
  });

  const deleteDoc = jest.fn(async (ref: { __id: string }) => {
    if (ref.__id.startsWith('friendRequests/')) {
      const id = ref.__id.split('/')[1];
      state.requests.delete(id);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setDoc = jest.fn(async (ref: { __id: string }, data: { friends?: { op?: 'union'; v: string } }, opts?: { merge?: boolean }) => {
    const userId = ref.__id.split('/')[1];
    if (!state.friends.has(userId)) state.friends.set(userId, new Set());
    const set = state.friends.get(userId)!;
    if (data.friends?.op === 'union') set.add(data.friends.v);
  });

  const getDoc = jest.fn(async (ref: { __id: string }) => {
    const userId = ref.__id.split('/')[1];
    const set = state.friends.get(userId);
    return {
      exists: () => !!set,
      data: () => ({ friends: set ? Array.from(set) : undefined }),
    };
  });

  const getDocs = jest.fn(async (q: { wheres: Array<{ field: string; value: string }> }) => {
    const filters = new Map(q.wheres.map(w => [w.field, w.value]));
    const from = filters.get('fromUserId');
    const to = filters.get('toUserId');
    const toOnly = filters.get('toUserId') && !filters.get('fromUserId');
    const fromOnly = filters.get('fromUserId') && !filters.get('toUserId');

    const items = Array.from(state.requests.values()).filter(r => {
      if (from && to) return r.fromUserId === from && r.toUserId === to;
      if (toOnly) return r.toUserId === filters.get('toUserId');
      if (fromOnly) return r.fromUserId === filters.get('fromUserId');
      return true;
    });
    return {
      empty: items.length === 0,
      docs: items.map(r => ({
        id: r.id,
        data: () => ({ ...r, createdAt: serverTimestamp() }),
      })),
      forEach: (cb: (doc: { id: string; data: () => unknown }) => void) => items.forEach(r => cb({ id: r.id, data: () => r })),
    };
  });

  const onSnapshot = jest.fn((ref: { wheres?: Array<{ field: string; op: string; value: string }>; __id?: string }, cb: (arg: unknown) => void, errCb?: (error: unknown) => void) => {
    if (ref.wheres) {
      const to = ref.wheres.find((w: { field: string; op: string; value: string }) => w.field === 'toUserId')?.value;
      const items = Array.from(state.requests.values()).filter(r => r.toUserId === to);
      cb({
        docs: items.map(r => ({ id: r.id, data: () => ({ ...r, createdAt: serverTimestamp() }) })),
      });
    } else if (ref.__id?.startsWith('users/')) {
      const userId = ref.__id.split('/')[1];
      const set = state.friends.get(userId);
      if (state.errors.friendsSnapshot && errCb) {
        errCb(new Error('fail'));
      } else {
        cb({
          exists: () => !!set,
          data: () => ({ friends: set ? Array.from(set) : undefined }),
        });
      }
    }
    return () => {};
  });

  const __reset = () => {
    state.requests.clear();
    state.friends.clear();
    state.errors.friendsSnapshot = false;
    addDoc.mockClear();
    updateDoc.mockClear();
    deleteDoc.mockClear();
    setDoc.mockClear();
  };
  const __setFriends = (userId: string, friends: string[]) => state.friends.set(userId, new Set(friends));
  const __setRequest = (id: string, fromUserId: string, toUserId: string, status: string) =>
    state.requests.set(id, { id, fromUserId, toUserId, status });

  return {
    collection, where, query, doc,
    serverTimestamp, arrayUnion, arrayRemove,
    addDoc, updateDoc, deleteDoc, setDoc, getDoc, getDocs, onSnapshot,
    __reset, __setFriends, __setRequest, __state: state,
  };
});

const firestoreMock = jest.requireMock('firebase/firestore') as {
  __reset: () => void;
  __setFriends: (userId: string, friends: string[]) => void;
  __setRequest: (id: string, fromUserId: string, toUserId: string, status: string) => void;
  __state: { friends: Map<string, Set<string>>; errors: { friendsSnapshot: boolean } };
  addDoc: jest.Mock;
  updateDoc: jest.Mock;
  deleteDoc: jest.Mock;
};

beforeEach(() => {
  firestoreMock.__reset();
});

describe('friends lib', () => {
  test('sendFriendRequest: already friends', async () => {
    firestoreMock.__setFriends('u1', ['u2']);
    await expect(sendFriendRequest('u1', 'u2')).rejects.toThrow('Already friends');
    expect(firestoreMock.addDoc).not.toHaveBeenCalled();
  });

  test('sendFriendRequest: existing pending from current user', async () => {
    firestoreMock.__setRequest('r1', 'u1', 'u2', 'pending');
    await expect(sendFriendRequest('u1', 'u2')).rejects.toThrow('Friend request already sent');
  });

  test('sendFriendRequest: resend on non-pending updates existing request', async () => {
    firestoreMock.__setRequest('r2', 'u1', 'u2', 'rejected');
    const id = await sendFriendRequest('u1', 'u2');
    expect(id).toBe('r2');
    expect(firestoreMock.updateDoc).toHaveBeenCalled();
  });

  test('sendFriendRequest: reverse pending auto-accepts', async () => {
    firestoreMock.__setRequest('r3', 'u2', 'u1', 'pending');
    await expect(sendFriendRequest('u1', 'u2')).rejects.toThrow(/auto-accepted/i);
    expect(Array.from(firestoreMock.__state.friends.get('u1') || [])).toContain('u2');
    expect(Array.from(firestoreMock.__state.friends.get('u2') || [])).toContain('u1');
  });

  test('accept/reject/cancel/remove friend flows', async () => {
    firestoreMock.__setRequest('r4', 'u1', 'u2', 'pending');
    await acceptFriendRequest('r4', 'u1', 'u2');
    const set1 = firestoreMock.__state.friends.get('u1') ?? new Set<string>();
    expect(Array.from(set1)).toContain('u2');
    const set2 = firestoreMock.__state.friends.get('u2') ?? new Set<string>();
    expect(Array.from(set2)).toContain('u1');

    await rejectFriendRequest('r4');
    expect(firestoreMock.updateDoc).toHaveBeenCalled();

    await cancelFriendRequest('r4');
    expect(firestoreMock.deleteDoc).toHaveBeenCalled();

    await removeFriend('u1', 'u2');
    expect(Array.from(firestoreMock.__state.friends.get('u1') || [])).not.toContain('u2');
    expect(Array.from(firestoreMock.__state.friends.get('u2') || [])).not.toContain('u1');
  });

  test('incoming/outgoing requests filters and subscription', async () => {
    firestoreMock.__setRequest('a1', 'u3', 'u1', 'pending');
    firestoreMock.__setRequest('a2', 'u4', 'u1', 'accepted');
    firestoreMock.__setRequest('b1', 'u1', 'u5', 'pending');

    const incoming = await getIncomingFriendRequests('u1');
    expect(incoming.map(r => r.id)).toEqual(['a1']);

    const outgoing = await getOutgoingFriendRequests('u1');
    expect(outgoing.map(r => r.id)).toEqual(['b1']);

    const cb = jest.fn();
    subscribeIncomingFriendRequests('u1', cb);
    expect(cb).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'a1' })]));
  });

  test('friends list get and subscribe, including error branch', async () => {
    firestoreMock.__setFriends('u9', ['u8']);
    const list = await getFriendsList('u9');
    expect(list).toEqual(['u8']);

    const cb = jest.fn();
    subscribeFriendsList('u9', cb);
    expect(cb).toHaveBeenCalledWith(['u8']);

    firestoreMock.__reset();
    firestoreMock.__state.errors.friendsSnapshot = true;
    const cb2 = jest.fn();
    subscribeFriendsList('u10', cb2);
    expect(cb2).toHaveBeenCalledWith([]);
  });

  test('checkFriendshipStatus branches', async () => {
    firestoreMock.__setFriends('u1', ['u2']);
    expect(await checkFriendshipStatus('u1', 'u2')).toBe('friends');

    firestoreMock.__reset();
    firestoreMock.__setRequest('c1', 'u1', 'u2', 'pending');
    expect(await checkFriendshipStatus('u1', 'u2')).toBe('pending_sent');

    firestoreMock.__reset();
    firestoreMock.__setRequest('c2', 'u2', 'u1', 'pending');
    expect(await checkFriendshipStatus('u1', 'u2')).toBe('pending_received');

    firestoreMock.__reset();
    expect(await checkFriendshipStatus('u1', 'u2')).toBe('none');
  });
});