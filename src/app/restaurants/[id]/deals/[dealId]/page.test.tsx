import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('DealDetailPage', () => {
  beforeEach(() => {
    // Removed jest.resetModules();
    jest.clearAllMocks();
  });

  it('renders deal title and description', async () => {
    jest.doMock('@/data/restaurants.json', () => [
      {
        id: 'r1',
        name: 'R1',
        deals: [{ id: 'd1', title: 'Half Off', description: 'All day' }],
      },
    ]);
    const mod = await import('./page');
    const DealDetailPage = mod.default;

    const element = await DealDetailPage({ params: Promise.resolve({ id: 'r1', dealId: 'd1' }) });
    render(element as unknown as React.ReactElement);

    expect(screen.getByRole('heading', { name: /half off/i })).toBeInTheDocument();
    expect(screen.getByText(/all day/i)).toBeInTheDocument();
  });
});