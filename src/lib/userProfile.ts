// User profile management functions
import { db } from './firebaseClient';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  getDocs,
  limit,
} from 'firebase/firestore';
import { UserProfile, UserProfileUpdate } from '@/types/userProfile';

const USERS_COLLECTION = 'users';

/**
 * Get user profile by userId
 * WHY: Fetch complete user profile data from Firestore for display and editing
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      userId: userDoc.id,
      username: data.username || '',
      email: data.email || '',
      avatarUrl: data.avatarUrl,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      cravings: data.cravings || [],
      favoriteCuisines: data.favoriteCuisines || [],
      favoriteRestaurants: data.favoriteRestaurants || [],
      dietaryRestrictions: data.dietaryRestrictions || [],
      allergies: data.allergies || [],
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Create a new user profile
 * WHY: Initialize profile when user first signs up
 */
export async function createUserProfile(
  userId: string,
  email: string,
  username: string,
  avatarUrl?: string
): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userDocRef, {
      username,
      usernameLower: username.toLowerCase(),
      email,
      avatarUrl: avatarUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      cravings: [],
      favoriteCuisines: [],
      favoriteRestaurants: [],
      dietaryRestrictions: [],
      allergies: [],
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 * WHY: Allow users to modify their preferences and personal information
 */
export async function updateUserProfile(
  userId: string,
  updates: UserProfileUpdate
): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  try {
    await updateDoc(userDocRef, {
      ...updates,
      ...(updates.username ? { usernameLower: updates.username.toLowerCase() } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(
          userDocRef,
          {
            ...updates,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        return;
      }
    } catch {}
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Add item to user's array field (cravings, cuisines, etc.)
 * WHY: Enable adding preferences without replacing entire array
 */
export async function addToUserArray(
  userId: string,
  field: keyof Pick<
    UserProfile,
    'cravings' | 'favoriteCuisines' | 'favoriteRestaurants' | 'dietaryRestrictions' | 'allergies'
  >,
  value: string
): Promise<void> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const currentArray = profile[field] as string[];
    if (!currentArray.includes(value)) {
      await updateUserProfile(userId, {
        [field]: [...currentArray, value],
      });
    }
  } catch (error) {
    console.error(`Error adding to ${field}:`, error);
    throw error;
  }
}

/**
 * Remove item from user's array field
 * WHY: Enable removing preferences without replacing entire array
 */
export async function removeFromUserArray(
  userId: string,
  field: keyof Pick<
    UserProfile,
    'cravings' | 'favoriteCuisines' | 'favoriteRestaurants' | 'dietaryRestrictions' | 'allergies'
  >,
  value: string
): Promise<void> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const currentArray = profile[field] as string[];
    await updateUserProfile(userId, {
      [field]: currentArray.filter((item) => item !== value),
    });
  } catch (error) {
    console.error(`Error removing from ${field}:`, error);
    throw error;
  }
}

export async function searchUsersByUsername(term: string, max: number = 10): Promise<Array<{ userId: string; username: string; avatarUrl?: string }>> {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const colRef = collection(db, USERS_COLLECTION);
  const q = query(colRef, orderBy('usernameLower'), startAt(t), endAt(t + '\uf8ff'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as { username?: string; avatarUrl?: string };
    return { userId: d.id, username: data.username ?? d.id, avatarUrl: data.avatarUrl };
  });
}
