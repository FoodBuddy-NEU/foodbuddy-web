import { render, screen, fireEvent } from '@testing-library/react';
const routerMock = { push: jest.fn(), replace: jest.fn() };
import BookmarksPage from './page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));
jest.mock('@/lib/firebaseClient', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({ signOut: jest.fn() }));

let mockUseAuth: () => { user: unknown; loading: boolean };
let mockSubscribeBookmarks: (uid: string, cb: (ids: Set<string>) => void) => () => void;
const subscribeState = { called: false, ids: [] as string[] };

jest.mock('@/lib/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));
jest.mock('@/lib/bookmarks', () => ({
  subscribeBookmarks: (uid: string, cb: (ids: Set<string>) => void) => mockSubscribeBookmarks(uid, cb),
}));

describe('BookmarksPage', () => {
  beforeEach(() => {
    // Default: signed out, no subscription
    mockUseAuth = () => ({ user: null, loading: false });
    subscribeState.called = false;
    subscribeState.ids = [];
    mockSubscribeBookmarks = (_uid: string, cb: (ids: Set<string>) => void) => {
      if (!subscribeState.called) {
        subscribeState.called = true;
        setTimeout(() => cb(new Set(subscribeState.ids)), 0);
      }
      return () => {};
    };
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    jest.clearAllMocks();
  });

  it('renders not signed in callouts', async () => {
    render(<BookmarksPage />);
    expect(screen.getByRole('heading', { name: /bookmarks/i })).toBeInTheDocument();
    expect(screen.getByText(/not signed in/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders signed-in header', async () => {
    mockUseAuth = () => ({ user: { email: 'a@b.com', uid: 'u1' }, loading: false });
    subscribeState.ids = ['r1', 'r2'];
    mockSubscribeBookmarks = (_uid: string, cb: (ids: Set<string>) => void) => {
      if (!subscribeState.called) {
        subscribeState.called = true;
        setTimeout(() => cb(new Set(subscribeState.ids)), 0);
      }
      return () => {};
    };

    render(<BookmarksPage />);
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /bookmarks/i })).toBeInTheDocument();
  });

  it('toggles filters and search input', () => {
    mockUseAuth = () => ({ user: { email: 'a@b.com', uid: 'u1' }, loading: false });
    render(<BookmarksPage />);
    const toggle = screen.getByRole('button', { name: /show filters/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const search = screen.getByLabelText(/search by name/i);
    fireEvent.change(search, { target: { value: 'bobby' } });
    expect(search).toHaveValue('bobby');
  });

  it('handles sorting options', () => {
    mockUseAuth = () => ({ user: { email: 'a@b.com', uid: 'u1' }, loading: false });
    render(<BookmarksPage />);
    
    // Open filters
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    
    // Test sort by distance
    const distanceBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Distance'));
    if (distanceBtn) fireEvent.click(distanceBtn);
    
    // Test sort by price
    const priceBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Price'));
    if (priceBtn) fireEvent.click(priceBtn);
    
    // Test sort by name
    const nameBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Name'));
    if (nameBtn) fireEvent.click(nameBtn);
    
    // Test sort by discount
    const discountBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Discount'));
    if (discountBtn) fireEvent.click(discountBtn);
  });

  it('toggles sort direction', () => {
    mockUseAuth = () => ({ user: { email: 'a@b.com', uid: 'u1' }, loading: false });
    render(<BookmarksPage />);
    
    // Open filters
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    
    // Find ascending/descending toggle
    const ascBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('asc') || btn.textContent?.includes('Ascending'));
    if (ascBtn) {
      fireEvent.click(ascBtn);
    }
    
    const descBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('desc') || btn.textContent?.includes('Descending'));
    if (descBtn) {
      fireEvent.click(descBtn);
    }
  });

  it('displays loading state', () => {
    mockUseAuth = () => ({ user: null, loading: true });
    render(<BookmarksPage />);
    expect(screen.getByRole('heading', { name: /bookmarks/i })).toBeInTheDocument();
  });

  it('handles empty bookmark list for signed in user', async () => {
    mockUseAuth = () => ({ user: { email: 'a@b.com', uid: 'u1' }, loading: false });
    subscribeState.ids = [];
    
    render(<BookmarksPage />);
    
    // Should show signed in status
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
  });
});