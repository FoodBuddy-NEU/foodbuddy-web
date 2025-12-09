import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  addToUserArray,
  removeFromUserArray,
} from '@/lib/userProfile';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
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
  serverTimestamp: jest.fn(() => ({ _seconds: Date.now() / 1000 })),
  collection: jest.fn(),
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
});
