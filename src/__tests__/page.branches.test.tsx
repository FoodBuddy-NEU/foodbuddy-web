import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
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
jest.mock('@/components/BookmarkButton', () => ({ __esModule: true, default: () => <div data-testid="bookmark-button" /> }));

jest.mock('@/lib/firebaseClient', () => ({ auth: {} }));
let mockUseAuth: () => { user: unknown; loading: boolean };
jest.mock('@/lib/AuthProvider', () => ({ useAuth: () => mockUseAuth() }));
jest.mock('firebase/auth', () => ({ signOut: jest.fn() }));

beforeEach(() => {
  mockUseAuth = () => ({ user: null, loading: false });
  Object.defineProperty(globalThis, 'fetch', {
    value: jest.fn(async () => ({ ok: true, json: async () => ({}) })),
    writable: true,
  });
});

test('RestaurantsPage distances ok=false', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({}) });
  const Page = (await import('@/app/page')).default;
  render(<Page />);
  expect(await screen.findByText(/Showing \d+ results/i)).toBeInTheDocument();
});

test('RestaurantsPage distances rejection', async () => {
  (global.fetch as jest.Mock).mockImplementationOnce(async () => { throw new Error('net'); });
  const Page = (await import('@/app/page')).default;
  render(<Page />);
  expect(await screen.findByText(/Showing \d+ results/i)).toBeInTheDocument();
});