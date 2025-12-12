import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RestaurantsPage from './page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return (<img {...props} />) as unknown as React.ReactElement;
  },
}));
jest.mock('@/lib/firebaseClient', () => ({ auth: {} }));
jest.mock('@/components/BookmarkButton', () => ({
  __esModule: true,
  default: () => <div data-testid="bookmark-button">Bookmark</div>,
}));

let mockUseAuth: () => { user: unknown; loading: boolean };
jest.mock('@/lib/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));
jest.mock('firebase/auth', () => ({ signOut: jest.fn() }));

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

  it('toggles filters and selects facets', async () => {
    render(<RestaurantsPage />);
    const toggle = screen.getByRole('button', { name: /show filters/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById('filters');
    const facetBtns = panel ? panel.querySelectorAll('button') : ([] as unknown as NodeListOf<HTMLButtonElement>);
    if (facetBtns[0]) fireEvent.click(facetBtns[0]);
    if (facetBtns[1]) fireEvent.click(facetBtns[1]);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('sort buttons update arrows and toggle asc/desc', () => {
    render(<RestaurantsPage />);
    const nameBtn = screen.getByRole('button', { name: /name/i });
    fireEvent.click(nameBtn);
    expect(nameBtn.textContent || '').toMatch(/↑|↓/);
    fireEvent.click(nameBtn);
    expect(nameBtn.textContent || '').toMatch(/↓/);
    fireEvent.click(screen.getByRole('button', { name: /price/i }));
    fireEvent.click(screen.getByRole('button', { name: /discount/i }));
    fireEvent.click(screen.getByRole('button', { name: /distance/i }));
  });
});