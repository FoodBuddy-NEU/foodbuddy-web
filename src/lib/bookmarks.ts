import { db } from '@/lib/firebaseClient'; // your existing client init
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

export function bookmarkDocRef(uid: string, restaurantId: string) {
  return doc(db, 'users', uid, 'bookmarks', restaurantId);
}

export async function addBookmark(uid: string, restaurantId: string) {
  // Storing an empty doc is enough. You can add fields like createdAt if desired.
  await setDoc(bookmarkDocRef(uid, restaurantId), { createdAt: Date.now() });
}

export async function removeBookmark(uid: string, restaurantId: string) {
  await deleteDoc(bookmarkDocRef(uid, restaurantId));
}

export function subscribeBookmarks(uid: string, cb: (ids: Set<string>) => void) {
  const colRef = collection(db, 'users', uid, 'bookmarks');
  return onSnapshot(colRef, (snap) => {
    const ids = new Set<string>();
    snap.forEach((d) => ids.add(d.id));
    cb(ids);
  });
}
