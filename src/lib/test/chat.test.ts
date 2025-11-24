import { sendTextMessage, subscribeGroupMessages } from '@/lib/chat';
import { db } from '@/lib/firebaseClient';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

jest.mock('@/lib/firebaseClient', () => ({ db: {} }));

jest.mock('firebase/firestore', () => {
  const addDoc = jest.fn(async () => ({}));
  const collection = jest.fn(() => ({ __ref: 'coll' }));
  const serverTimestamp = jest.fn(() => 'SERVER_TS');
  const orderBy = jest.fn(() => ({ field: 'createdAt', dir: 'asc' }));
  const query = jest.fn(() => ({ __q: true }));
  const onSnapshot = jest.fn(
    (q: unknown, cb: (snapshot: { docs: Array<{ id: string; data: () => unknown }> }) => void) => {
      cb({
        docs: [
          {
            id: 'm1',
            data: () => ({
              groupId: 'g1',
              senderId: 'u1',
              type: 'text',
              text: 'Hello',
              createdAt: null,
            }),
          },
          {
            id: 'm2',
            data: () => ({
              groupId: 'g1',
              senderId: 'u2',
              type: 'text',
              text: 'Hi',
              createdAt: null,
            }),
          },
        ],
      });
      return () => {};
    }
  );
  const doc = jest.fn();
  const setDoc = jest.fn();
  const updateDoc = jest.fn();
  const arrayUnion = jest.fn();
  const arrayRemove = jest.fn();
  return {
    addDoc,
    collection,
    serverTimestamp,
    orderBy,
    query,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
  };
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
    expect(args[0]).toEqual({ __ref: 'coll' });
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
    expect(messages[0]).toMatchObject({
      id: 'm1',
      text: 'Hello',
      senderId: 'u1',
      groupId: 'g1',
      type: 'text',
    });
    expect(messages[1]).toMatchObject({
      id: 'm2',
      text: 'Hi',
      senderId: 'u2',
      groupId: 'g1',
      type: 'text',
    });
  });
});
