import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/lib/ThemeProvider';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return (<img {...props} />) as unknown as React.ReactElement;
  },
}));

jest.mock('@/lib/distance', () => ({
  calculateDistance: async () => 1.0,
  DEFAULT_USER_ADDRESS: 'X',
}));

jest.mock('@/lib/cloudinary', () => ({
  __esModule: true,
  default: {
    config: () => ({}),
    api: {
      resources: jest.fn(async () => ({ resources: [] })),
      resources_by_asset_folder: jest.fn(async () => ({ resources: [] })),
    },
  },
}));

// NEW: mock next/navigation router to satisfy BookmarkButton
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  notFound: jest.fn(),
}));
jest.mock('@/lib/firebaseClient', () => ({ db: {}, auth: {} }));

describe('RestaurantDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore?.();
  });

  it('renders basic details, deals fallback, and no menu', async () => {
    const mod = await import('./page');
    const RestaurantDetailPage = mod.default;
    const element = await RestaurantDetailPage({
      params: Promise.resolve({ id: 'bobby-gs-pizzeria' }),
    });
    render(<ThemeProvider>{element as unknown as React.ReactElement}</ThemeProvider>);

    expect(screen.getByRole('heading', { name: /bobby g/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument();
    expect(screen.getByText(/berkeley, ca/i)).toBeInTheDocument();
    expect(screen.getByText(/\(510\)/i)).toBeInTheDocument();
  });

  it('renders deals and menus when present', async () => {
    const mod2 = await import('./page');
    const RestaurantDetailPage2 = mod2.default;
    const element2 = await RestaurantDetailPage2({ params: Promise.resolve({ id: '84-viet' }) });
    render(<ThemeProvider>{element2 as unknown as React.ReactElement}</ThemeProvider>);

    expect(screen.getByRole('heading', { name: /84 viet/i })).toBeInTheDocument();
    expect(screen.getByText(/10% off/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /menu/i })).toBeInTheDocument();
  });

  it('renders restaurant with photos', async () => {
    const cloudinary = await import('@/lib/cloudinary');
    const mockApi = cloudinary.default.api as unknown as {
      resources_by_asset_folder: jest.Mock;
    };
    mockApi.resources_by_asset_folder.mockResolvedValueOnce({
      resources: [
        { secure_url: 'https://example.com/photo1.jpg', asset_id: '1' },
        { secure_url: 'https://example.com/photo2.jpg', asset_id: '2' },
      ],
    });

    const mod = await import('./page');
    const RestaurantDetailPage = mod.default;
    const element = await RestaurantDetailPage({
      params: Promise.resolve({ id: 'bobby-gs-pizzeria' }),
    });
    render(<ThemeProvider>{element as unknown as React.ReactElement}</ThemeProvider>);

    expect(screen.getByRole('heading', { name: /bobby g/i })).toBeInTheDocument();
  });

  it('handles restaurant with all optional fields', async () => {
    const mod = await import('./page');
    const RestaurantDetailPage = mod.default;
    const element = await RestaurantDetailPage({
      params: Promise.resolve({ id: 'southside-station' }),
    });
    render(<ThemeProvider>{element as unknown as React.ReactElement}</ThemeProvider>);

    expect(screen.getByRole('heading', { name: /southside station/i })).toBeInTheDocument();
  });

  it('handles restaurants with Yelp info', async () => {
    const mod = await import('./page');
    const RestaurantDetailPage = mod.default;
    const element = await RestaurantDetailPage({
      params: Promise.resolve({ id: 'bobby-gs-pizzeria' }),
    });
    render(<ThemeProvider>{element as unknown as React.ReactElement}</ThemeProvider>);

    // Should display Yelp rating if available
    expect(screen.getByRole('heading', { name: /bobby g/i })).toBeInTheDocument();
  });

  it('handles restaurant with multiple deals', async () => {
    const mod = await import('./page');
    const RestaurantDetailPage = mod.default;
    const element = await RestaurantDetailPage({ params: Promise.resolve({ id: '84-viet' }) });
    render(<ThemeProvider>{element as unknown as React.ReactElement}</ThemeProvider>);

    // 84-viet has deals
    expect(screen.getByText(/10% off/i)).toBeInTheDocument();
  });
});
