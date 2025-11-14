import { render, screen, waitFor } from '@testing-library/react';
import RestaurantsPage from './page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

let mockUseAuth: () => { user: unknown; loading: boolean };
jest.mock('@/lib/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Home RestaurantsPage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Default auth state: signed out
    mockUseAuth = () => ({ user: null, loading: false });
    // Mock distances fetch in effect
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore?.();
  });

  it('renders heading and auth callouts', async () => {
    render(<RestaurantsPage />);
    expect(screen.getByRole('heading', { name: /find restaurants/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/not signed in/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });
  });

  it('shows loading indicator when auth is loading', async () => {
    mockUseAuth = () => ({ user: null, loading: true });
    render(<RestaurantsPage />);
    expect(screen.getByText(/checking auth/i)).toBeInTheDocument();
  });

  it('shows signed-in header when user exists', async () => {
    mockUseAuth = () => ({ user: { email: 'user@example.com', uid: 'u1' }, loading: false });
    render(<RestaurantsPage />);
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});