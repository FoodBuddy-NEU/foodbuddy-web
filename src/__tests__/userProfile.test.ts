import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  addToUserArray,
  removeFromUserArray,
  searchUsersByUsername,
} from '@/lib/userProfile';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';

// Mock Firestore
jest.mock('@/lib/firebaseClient', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _seconds: Date.now() / 1000 })),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
}));

describe('User Profile Functions', () => {
  const mockUserId = 'test-user-123';
  const mockEmail = 'test@example.com';
  const mockUsername = 'TestUser';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile when it exists', async () => {
      const mockProfileData = {
        username: mockUsername,
        email: mockEmail,
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-02') },
        cravings: ['Ramen', 'Pizza'],
        favoriteCuisines: ['Japanese', 'Italian'],
        favoriteRestaurants: ['rest-1', 'rest-2'],
        dietaryRestrictions: ['Vegetarian'],
        allergies: ['Peanuts'],
      };

      (doc as jest.Mock).mockReturnValue({ id: mockUserId });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockProfileData,
        id: mockUserId,
      });

      const result = await getUserProfile(mockUserId);

      expect(result).toEqual({
        userId: mockUserId,
        username: mockUsername,
        email: mockEmail,
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        cravings: ['Ramen', 'Pizza'],
        favoriteCuisines: ['Japanese', 'Italian'],
        favoriteRestaurants: ['rest-1', 'rest-2'],
        dietaryRestrictions: ['Vegetarian'],
        allergies: ['Peanuts'],
      });
    });

    it('should return null when profile does not exist', async () => {
      (doc as jest.Mock).mockReturnValue({ id: mockUserId });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await getUserProfile(mockUserId);

      expect(result).toBeNull();
    });

    it('should handle missing optional fields', async () => {
      const mockProfileData = {
        username: mockUsername,
        email: mockEmail,
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-02') },
      };

      (doc as jest.Mock).mockReturnValue({ id: mockUserId });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockProfileData,
        id: mockUserId,
      });

      const result = await getUserProfile(mockUserId);

      expect(result?.cravings).toEqual([]);
      expect(result?.favoriteCuisines).toEqual([]);
      expect(result?.favoriteRestaurants).toEqual([]);
      expect(result?.dietaryRestrictions).toEqual([]);
      expect(result?.allergies).toEqual([]);
    });
  });

  describe('createUserProfile', () => {
    it('should create a new user profile with all required fields', async () => {
      (doc as jest.Mock).mockReturnValue({ id: mockUserId });

      await createUserProfile(mockUserId, mockEmail, mockUsername);

      expect(setDoc).toHaveBeenCalledWith(
        { id: mockUserId },
        expect.objectContaining({
          username: mockUsername,
          email: mockEmail,
          avatarUrl: null,
          cravings: [],
          favoriteCuisines: [],
          favoriteRestaurants: [],
          dietaryRestrictions: [],
          allergies: [],
        })
      );
    });

    it('should create profile with avatar URL when provided', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      (doc as jest.Mock).mockReturnValue({ id: mockUserId });

      await createUserProfile(mockUserId, mockEmail, mockUsername, avatarUrl);

      expect(setDoc).toHaveBeenCalledWith(
        { id: mockUserId },
        expect.objectContaining({
          avatarUrl,
        })
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile fields', async () => {
      const updates = {
        username: 'NewUsername',
        cravings: ['Sushi', 'Tacos'],
      };

      (doc as jest.Mock).mockReturnValue({ id: mockUserId });

      await updateUserProfile(mockUserId, updates);

      // updateUserProfile now uses setDoc with merge: true
      expect(setDoc).toHaveBeenCalledWith(
        { id: mockUserId },
        expect.objectContaining(updates),
        { merge: true }
      );
    });
  });

  describe('addToUserArray', () => {
    it('should add item to array field', async () => {
      const mockProfile = {
        userId: mockUserId,
        username: mockUsername,
        email: mockEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
        cravings: ['Ramen'],
        favoriteCuisines: [],
        favoriteRestaurants: [],
        dietaryRestrictions: [],
        allergies: [],
      };

      (doc as jest.Mock).mockReturnValue({ id: mockUserId });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockProfile,
          createdAt: { toDate: () => mockProfile.createdAt },
          updatedAt: { toDate: () => mockProfile.updatedAt },
        }),
        id: mockUserId,
      });

      await addToUserArray(mockUserId, 'cravings', 'Pizza');

      // addToUserArray internally calls updateUserProfile which uses setDoc with merge: true
      expect(setDoc).toHaveBeenCalledWith(
        { id: mockUserId },
        expect.objectContaining({
          cravings: ['Ramen', 'Pizza'],
        }),
        { merge: true }
      );
    });

    it('should not add duplicate items', async () => {
      const mockProfile = {
        userId: mockUserId,
        username: mockUsername,
        email: mockEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
        cravings: ['Ramen', 'Pizza'],
        favoriteCuisines: [],
        favoriteRestaurants: [],
        dietaryRestrictions: [],
        allergies: [],
      };

      (doc as jest.Mock).mockReturnValue({ id: mockUserId });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockProfile,
          createdAt: { toDate: () => mockProfile.createdAt },
          updatedAt: { toDate: () => mockProfile.updatedAt },
        }),
        id: mockUserId,
      });

      await addToUserArray(mockUserId, 'cravings', 'Pizza');

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('removeFromUserArray', () => {
    it('should remove item from array field', async () => {
      const mockProfile = {
        userId: mockUserId,
        username: mockUsername,
        email: mockEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
        cravings: ['Ramen', 'Pizza', 'Sushi'],
        favoriteCuisines: [],
        favoriteRestaurants: [],
        dietaryRestrictions: [],
        allergies: [],
      };

      (doc as jest.Mock).mockReturnValue({ id: mockUserId });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          ...mockProfile,
          createdAt: { toDate: () => mockProfile.createdAt },
          updatedAt: { toDate: () => mockProfile.updatedAt },
        }),
        id: mockUserId,
      });

      await removeFromUserArray(mockUserId, 'cravings', 'Pizza');

      // removeFromUserArray internally calls updateUserProfile which uses setDoc with merge: true
      expect(setDoc).toHaveBeenCalledWith(
        { id: mockUserId },
        expect.objectContaining({
          cravings: ['Ramen', 'Sushi'],
        }),
        { merge: true }
      );
    });
  });

  describe('searchUsersByUsername', () => {
    it('should return matching users', async () => {
      const mockDocs = [
        {
          id: 'user1',
          exists: () => true,
          data: () => ({
            username: 'testuser',
            email: 'test@example.com',
            avatarUrl: '/avatar.jpg',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            cravings: [],
            favoriteCuisines: [],
            favoriteRestaurants: [],
            dietaryRestrictions: [],
            allergies: [],
          }),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        forEach: (cb: (doc: unknown) => void) => mockDocs.forEach(cb),
      });

      const result = await searchUsersByUsername('test', 10);

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('testuser');
      expect(result[0].userId).toBe('user1');
    });

    it('should return empty array when no matches', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        forEach: () => {},
      });

      const result = await searchUsersByUsername('nonexistent', 10);

      expect(result).toEqual([]);
    });

    it('should filter out users whose username does not start with search term', async () => {
      const mockDocs = [
        {
          id: 'user1',
          exists: () => true,
          data: () => ({
            username: 'TESTUSER',  // Uppercase - should still match due to case-insensitive
            email: 'test@example.com',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'user2',
          exists: () => true,
          data: () => ({
            username: 'anotheruser',  // Doesn't start with 'test'
            email: 'another@example.com',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        forEach: (cb: (doc: unknown) => void) => mockDocs.forEach(cb),
      });

      const result = await searchUsersByUsername('test', 10);

      // Only TESTUSER should match (case-insensitive)
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('TESTUSER');
    });

    it('should return empty array on error', async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await searchUsersByUsername('test', 10);

      expect(result).toEqual([]);
    });
  });
});
