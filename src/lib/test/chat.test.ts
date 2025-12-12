import { sendTextMessage, subscribeGroupMessages, addGroupMember, removeGroupMember, disbandGroup, createGroup, subscribeGroupMeta, updateGroupDiningTime, updateGroupRestaurant } from '@/lib/chat';
import { db } from '@/lib/firebaseClient';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';

type MockRef = { __id: string };

jest.mock('@/lib/firebaseClient', () => ({ db: {} }));

jest.mock('firebase/firestore', () => {
  const addDoc = jest.fn(async () => ({}));
  const collection = jest.fn((dbArg: unknown, col: string, id?: string, sub?: string) => ({ __ref: id ? `${col}/${id}${sub ? `/${sub}` : ''}` : col }));
  const serverTimestamp = jest.fn(() => 'SERVER_TS');
  const orderBy = jest.fn(() => ({ field: 'createdAt', dir: 'asc' }));
  const query = jest.fn(() => ({ __q: true }));
  // Support both callback styles: onSnapshot(q, callback) and onSnapshot(q, { next, error })
  const onSnapshot = jest.fn((q: unknown, cbOrOptions: ((snapshot: unknown) => void) | { next?: (snapshot: unknown) => void }) => {
    const snapshot = {
      docs: [
        { id: 'm1', data: () => ({ groupId: 'g1', senderId: 'u1', type: 'text', text: 'Hello', createdAt: null }) },
        { id: 'm2', data: () => ({ groupId: 'g1', senderId: 'u2', type: 'text', text: 'Hi', createdAt: null }) },
      ],
    };
    if (typeof cbOrOptions === 'function') {
      cbOrOptions(snapshot);
    } else if (cbOrOptions && typeof cbOrOptions.next === 'function') {
      cbOrOptions.next(snapshot);
    }
    return () => {};
  });
  const doc = jest.fn((dbArg: unknown, col: string, id: string) => ({ __id: `${col}/${id}` }));
  const setDoc = jest.fn();
  const updateDoc = jest.fn();
  const arrayUnion = jest.fn((v: unknown) => ({ op: 'union', v }));
  const arrayRemove = jest.fn((v: unknown) => ({ op: 'remove', v }));
  const deleteDoc = jest.fn(async () => {});
  const getDocs = jest.fn(async () => ({ docs: [{ ref: { __id: 'messages/m1' } }, { ref: { __id: 'messages/m2' } }] }));
  return { addDoc, collection, serverTimestamp, orderBy, query, onSnapshot, doc, setDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('sendTextMessage', () => {
  it('adds a doc with trimmed text', async () => {
    await sendTextMessage({ groupId: 'g1', senderId: 'u1', text: ' hi ' });
    expect(collection).toHaveBeenCalledWith(db, 'groups', 'g1', 'messages');
    expect(addDoc).toHaveBeenCalledTimes(1);
    const args = (addDoc as unknown as jest.Mock).mock.calls[0];
    expect(args[0]).toEqual({ __ref: 'groups/g1/messages' });
    expect(args[1]).toMatchObject({
      groupId: 'g1',
      senderId: 'u1',
      type: 'text',
      text: 'hi',
    });
    expect(serverTimestamp).toHaveBeenCalled();
    expect(args[1].createdAt).toBe('SERVER_TS');
  });

  it('does nothing for blank input', async () => {
    await sendTextMessage({ groupId: 'g1', senderId: 'u1', text: '   ' });
    expect(addDoc).not.toHaveBeenCalled();
  });
});

describe('subscribeGroupMessages', () => {
  it('subscribes, orders by createdAt asc, and maps snapshot to ChatMessage[]', () => {
    const cb = jest.fn();
    const unsubscribe = subscribeGroupMessages('g1', cb);
    expect(typeof unsubscribe).toBe('function');
    expect(collection).toHaveBeenCalledWith(db, 'groups', 'g1', 'messages');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'asc');
    expect(query).toHaveBeenCalled();
    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledTimes(1);
    const messages = (cb as unknown as jest.Mock).mock.calls[0][0];
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ id: 'm1', text: 'Hello', senderId: 'u1', groupId: 'g1', type: 'text' });
    expect(messages[1]).toMatchObject({ id: 'm2', text: 'Hi', senderId: 'u2', groupId: 'g1', type: 'text' });
  });
});

describe('group membership updates', () => {
  it('addGroupMember uses arrayUnion and updates timestamp', async () => {
    const updateDocMock = updateDoc as unknown as jest.Mock;
    await addGroupMember('g1', 'u2');
    expect(doc).toHaveBeenCalledWith(db, 'groups', 'g1');
    expect(updateDocMock).toHaveBeenCalledTimes(1);
    const args = updateDocMock.mock.calls[0][1];
    expect(args.memberIds).toMatchObject({ op: 'union', v: 'u2' });
    expect(serverTimestamp).toHaveBeenCalled();
  });

  it('removeGroupMember uses arrayRemove and updates timestamp', async () => {
    const updateDocMock = updateDoc as unknown as jest.Mock;
    await removeGroupMember('g1', 'u2');
    const args = updateDocMock.mock.calls[0][1];
    expect(args.memberIds).toMatchObject({ op: 'remove', v: 'u2' });
    expect(serverTimestamp).toHaveBeenCalled();
  });
});

describe('disbandGroup', () => {
  it('deletes all messages then deletes the group doc', async () => {
    const deleteDocMock = deleteDoc as unknown as jest.Mock;
    await disbandGroup('g1');
    const calls = (deleteDocMock.mock.calls as Array<[MockRef]>).map((c) => c[0]);
    expect(calls).toHaveLength(3);
    const hasGroupDelete = calls.some((ref) => ref.__id === 'groups/g1');
    const messageDeletes = calls.filter((ref) => ref.__id.startsWith('messages/'));
    expect(hasGroupDelete).toBe(true);
    expect(messageDeletes).toHaveLength(2);
  });
});

describe('group meta and updates', () => {
  it('createGroup handles blank and non-blank names', async () => {
    (addDoc as unknown as jest.Mock).mockImplementationOnce(async () => ({ id: 'gNew' }));
    const id1 = await createGroup('   ', 'u1');
    expect(id1).toBe('gNew');
    const payload1 = (addDoc as unknown as jest.Mock).mock.calls[0][1];
    expect(payload1.name).toBe('Untitled');
    expect(payload1.ownerId).toBe('u1');

    (addDoc as unknown as jest.Mock).mockImplementationOnce(async () => ({ id: 'gNamed' }));
    const id2 = await createGroup(' MyGroup ', 'u1');
    expect(id2).toBe('gNamed');
    const payload2 = (addDoc as unknown as jest.Mock).mock.calls[1][1];
    expect(payload2.name).toBe('MyGroup');
    expect(payload2.ownerId).toBe('u1');
  });

  it('subscribeGroupMeta handles exists true/false', () => {
    const cb = jest.fn();
    (onSnapshot as unknown as jest.Mock).mockImplementationOnce((ref, options: { next?: (snap: unknown) => void }) => {
      if (options && typeof options.next === 'function') {
        options.next({ exists: () => true, data: () => ({ name: 'Group', ownerId: 'u1', memberIds: ['u1'] }) });
      }
      return () => {};
    });
    subscribeGroupMeta('g1', cb);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ name: 'Group' }));

    const cb2 = jest.fn();
    (onSnapshot as unknown as jest.Mock).mockImplementationOnce((ref, options: { next?: (snap: unknown) => void }) => {
      if (options && typeof options.next === 'function') {
        options.next({ exists: () => false, data: () => ({}) });
      }
      return () => {};
    });
    subscribeGroupMeta('g1', cb2);
    expect(cb2).toHaveBeenCalledWith({});
  });

  it('updateGroupDiningTime and updateGroupRestaurant call updateDoc with fields', async () => {
    const updateDocMock = updateDoc as unknown as jest.Mock;
    await updateGroupDiningTime('g1', '7pm');
    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ diningTime: '7pm' }));
    await updateGroupRestaurant('g1', 'r1', 'R Name');
    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ restaurantId: 'r1', restaurantName: 'R Name' }));
  });
});