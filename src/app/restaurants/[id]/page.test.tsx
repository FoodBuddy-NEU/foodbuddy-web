import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/lib/ThemeProvider';

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

// NEW: mock next/navigation router to satisfy BookmarkButton
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
}));

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
    jest.doMock('@/data/restaurants.json', () => [
      {
        id: 'r1',
        name: 'R1',
        address: 'Addr',
        phone: '123',
        images: [],
        deals: [],
        menus: [],
      },
    ]);
    jest.doMock('@/lib/distance', () => ({
      calculateDistance: async () => 1.2,
      DEFAULT_USER_ADDRESS: 'X',
    }));
    jest.doMock('@/lib/cloudinary', () => ({
      default: {
        config: () => ({}),
        api: {
          resources: jest.fn(async () => ({ resources: [] })),
          resources_by_asset_folder: jest.fn(async () => ({ resources: [] })),
        },
      },
    }));

    const cl = (await import('@/lib/cloudinary')).default as unknown as { api?: Record<string, unknown> };
    cl.api = cl.api ?? {
      resources: jest.fn(async () => ({ resources: [] })),
      resources_by_asset_folder: jest.fn(async () => ({ resources: [] })),
    };

    const mod = await import('./page');
    const RestaurantDetailPage = mod.default;
    const element = await RestaurantDetailPage({ params: Promise.resolve({ id: 'r1' }) });
    render(<ThemeProvider>{element as unknown as React.ReactElement}</ThemeProvider>);

    expect(screen.getByRole('heading', { name: /r1/i })).toBeInTheDocument();
    expect(screen.getByText(/deals/i)).toBeInTheDocument();
    expect(screen.getByText(/no menu available/i)).toBeInTheDocument();
    expect(screen.getByText(/addr/i)).toBeInTheDocument();
    expect(screen.getByText(/123/i)).toBeInTheDocument();
  });
});