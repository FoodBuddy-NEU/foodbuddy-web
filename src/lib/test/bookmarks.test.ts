/* bookmarks.test.ts */

jest.mock('@/lib/firebaseClient', () => ({ db: {} }));

// Inline Firestore mocks inside the factory to avoid TDZ issues
jest.mock('firebase/firestore', () => {
  const doc = jest.fn(
    (_db: unknown, _c1: string, _uid: string, _c2: string, restaurantId: string) => ({
      id: restaurantId,
    })
  );
  const setDoc = jest.fn(async () => {});
  const deleteDoc = jest.fn(async () => {});
  const collection = jest.fn(() => ({ id: 'col' }));
  const onSnapshot = jest.fn(
    (
      _colRef: unknown,
      cb: (snap: { forEach: (fn: (d: { id: string }) => void) => void }) => void
    ) => {
      const snap = {
        forEach: (fn: (d: { id: string }) => void) => {
          fn({ id: 'r1' });
          fn({ id: 'r2' });
        },
      };
      cb(snap);
      return () => {};
    }
  );
  return { doc, setDoc, deleteDoc, collection, onSnapshot };
});

// Import the mocked functions so we can assert on them
import * as firestore from 'firebase/firestore';

import { addBookmark, removeBookmark, subscribeBookmarks, bookmarkDocRef } from '../bookmarks';

describe('bookmarks lib', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bookmarkDocRef returns a doc reference with id', () => {
    const ref = bookmarkDocRef('u1', 'r1');
    expect(ref).toMatchObject({ id: 'r1' });
  });

  it('addBookmark calls setDoc with createdAt', async () => {
    await addBookmark('u1', 'r42');
    expect(firestore.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ createdAt: expect.any(Number) })
    );
  });

  it('removeBookmark calls deleteDoc', async () => {
    await removeBookmark('u1', 'r42');
    expect(firestore.deleteDoc).toHaveBeenCalled();
  });

  it('subscribeBookmarks emits Set of ids', () => {
    const cb = jest.fn();
    const unsub = subscribeBookmarks('u1', cb);
    expect(firestore.onSnapshot).toHaveBeenCalled();
    expect(cb).toHaveBeenCalledWith(new Set(['r1', 'r2']));
    expect(typeof unsub).toBe('function');
  });
});
