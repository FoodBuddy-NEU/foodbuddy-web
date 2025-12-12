import { render, screen, waitFor } from '@testing-library/react';
import UsernameChecker from '../UsernameChecker';

jest.mock('@/lib/userProfile', () => ({
  getUserProfile: jest.fn(),
}));

jest.mock('@/lib/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

describe('UsernameChecker', () => {
  const { useAuth } = jest.requireMock('@/lib/AuthProvider') as { useAuth: jest.Mock };
  const { getUserProfile } = jest.requireMock('@/lib/userProfile') as { getUserProfile: jest.Mock };

  beforeEach(() => {
    useAuth.mockReset();
    getUserProfile.mockReset();
  });

  test('renders children when not logged in', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    render(<UsernameChecker><div data-testid="content">X</div></UsernameChecker>);
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.queryByText(/welcome to foodbuddy/i)).not.toBeInTheDocument();
  });

  test('shows modal when username missing', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
    getUserProfile.mockResolvedValue(null);
    render(<UsernameChecker><div /></UsernameChecker>);
    expect(await screen.findByText(/welcome to foodbuddy/i)).toBeInTheDocument();
  });

  test('does not show modal when username present', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
    getUserProfile.mockResolvedValue({ username: 'john' });
    render(<UsernameChecker><div /></UsernameChecker>);
    await waitFor(() => {
      expect(screen.queryByText(/welcome to foodbuddy/i)).not.toBeInTheDocument();
    });
  });

  test('on error defaults to showing modal', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
    getUserProfile.mockRejectedValue(new Error('net'));
    render(<UsernameChecker><div /></UsernameChecker>);
    expect(await screen.findByText(/welcome to foodbuddy/i)).toBeInTheDocument();
  });

  test('shows loading when authLoading is true', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    render(<UsernameChecker><div /></UsernameChecker>);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});