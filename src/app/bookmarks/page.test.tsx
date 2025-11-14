import { render, screen } from '@testing-library/react';
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
});