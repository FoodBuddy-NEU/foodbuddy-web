import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '@/app/profile/page';
import { useAuth } from '@/lib/AuthProvider';
import { getUserProfile } from '@/lib/userProfile';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';

// Mock dependencies
jest.mock('@/lib/AuthProvider');
jest.mock('@/lib/userProfile');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/components/UserProfileForm', () => {
  return function MockUserProfileForm({ profile }: { profile: { username: string } }) {
    return <div data-testid="user-profile-form">Profile for {profile.username}</div>;
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('ProfilePage', () => {
  const mockPush = jest.fn();
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    phoneNumber: null,
    photoURL: null,
    providerId: 'firebase',
  } as User;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it('shows loading state initially', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: true });

    render(<ProfilePage />);

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('displays user profile form when profile exists', async () => {
    const mockProfile = {
      userId: 'test-user-123',
      username: 'TestUser',
      email: 'test@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      cravings: ['Ramen'],
      favoriteCuisines: ['Japanese'],
      favoriteRestaurants: [],
      dietaryRestrictions: [],
      allergies: [],
    };

    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockGetUserProfile.mockResolvedValue(mockProfile);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId('user-profile-form')).toBeInTheDocument();
      expect(screen.getByText('Profile for TestUser')).toBeInTheDocument();
    });
  });

  it('creates default profile when profile does not exist', async () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockGetUserProfile.mockResolvedValue(null);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId('user-profile-form')).toBeInTheDocument();
      expect(screen.getByText(/Profile for test/i)).toBeInTheDocument();
    });
  });

  it('displays error message when profile fetch fails', async () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockGetUserProfile.mockRejectedValue(new Error('Failed to fetch'));

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load profile. Please try again.')).toBeInTheDocument();
    });
  });

  it('waits for auth loading before checking user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    render(<ProfilePage />);

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });
});
