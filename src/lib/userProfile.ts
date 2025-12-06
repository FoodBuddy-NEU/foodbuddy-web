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
  where,
  limit,
  getDocs,
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
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
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

/**
 * Search users by username (case-insensitive prefix search)
 * WHY: Allow users to find other users to add to groups
 */
export async function searchUsersByUsername(
  searchTerm: string,
  maxResults: number = 10
): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    // Firestore doesn't support case-insensitive queries natively,
    // so we search for the lowercase version and filter
    const searchLower = searchTerm.toLowerCase();
    const q = query(
      usersRef,
      where('displayName', '>=', searchLower),
      where('displayName', '<=', searchLower + '\uf8ff'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    const results: UserProfile[] = [];
    
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        results.push(docSnap.data() as UserProfile);
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error searching users by username:', error);
    return [];
  }
}
