import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfileModal from '../UserProfileModal';

jest.mock('@/lib/userProfile', () => ({ getUserProfile: jest.fn() }));
jest.mock('@/lib/ThemeProvider', () => ({ useTheme: jest.fn(() => ({ theme: 'light' })) }));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

const { getUserProfile } = jest.requireMock('@/lib/userProfile') as { getUserProfile: jest.Mock };

const baseProfile = {
  userId: 'u1',
  username: 'Alice',
  email: 'a@example.com',
  avatarUrl: undefined as string | undefined,
  cravings: [] as string[],
  favoriteCuisines: [] as string[],
  favoriteRestaurants: [] as string[],
  dietaryRestrictions: [] as string[],
  allergies: [] as string[],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserProfileModal', () => {
  beforeEach(() => { getUserProfile.mockReset(); });

  test('returns null when closed', () => {
    render(<UserProfileModal userId="u1" isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText(/User Profile/i)).not.toBeInTheDocument();
  });

  test('shows loading when opened initially', () => {
    getUserProfile.mockResolvedValue({ ...baseProfile });
    render(<UserProfileModal userId="u1" isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  test('shows "User not found" when profile is null', async () => {
    getUserProfile.mockResolvedValue(null);
    render(<UserProfileModal userId="u1" isOpen={true} onClose={() => {}} />);
    expect(await screen.findByText(/User not found/i)).toBeInTheDocument();
  });

  test('renders avatar with Cloudinary HEIC converted to JPG', async () => {
    getUserProfile.mockResolvedValue({ ...baseProfile, avatarUrl: 'https://res.cloudinary.com/test/image/upload/v1/avatar.heic' });
    render(<UserProfileModal userId="u1" isOpen={true} onClose={() => {}} />);
    const img = await screen.findByRole('img');
    expect(img.getAttribute('src')!.toLowerCase()).toMatch(/\.jpg$/);
  });

  test('falls back to placeholder when image error', async () => {
    getUserProfile.mockResolvedValue({ ...baseProfile, avatarUrl: 'https://res.cloudinary.com/test/image/upload/v1/avatar.jpg' });
    render(<UserProfileModal userId="u1" isOpen={true} onClose={() => {}} />);
    const img = await screen.findByRole('img');
    fireEvent.error(img);
    expect(await screen.findByText('A')).toBeInTheDocument();
  });

  test('renders tags and "None" for empty sections', async () => {
    getUserProfile.mockResolvedValue({
      ...baseProfile,
      cravings: ['Pizza'],
      favoriteCuisines: [],
      dietaryRestrictions: ['Vegan'],
      allergies: [],
    });
    render(<UserProfileModal userId="u1" isOpen={true} onClose={() => {}} />);
    expect(await screen.findByText('Pizza')).toBeInTheDocument();
    expect(screen.getAllByText('None').length).toBeGreaterThan(0);
  });

  test('closes via close button and backdrop', async () => {
    const onClose = jest.fn();
    getUserProfile.mockResolvedValue({ ...baseProfile });
    render(<UserProfileModal userId="u1" isOpen={true} onClose={onClose} />);
    const closeBtn = await screen.findByText('×');
    fireEvent.click(closeBtn);
    fireEvent.click(screen.getByText(/User Profile/i).closest('.upm-modal')!.parentElement!); // backdrop
    expect(onClose).toHaveBeenCalled();
  });
});