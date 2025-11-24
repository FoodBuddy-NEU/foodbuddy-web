import { MockNextRequest, MockNextResponse } from '../__test_setup__/testServer';

jest.mock('next/server', () => {
  return { NextResponse: MockNextResponse };
});

jest.mock('@/lib/distance', () => ({
  DEFAULT_USER_ADDRESS: '5000 MacArthur Blvd, Oakland, CA',
  calculateDistancesForRestaurants: jest.fn(async (restaurants: Array<{ id: string }>) => {
    const m = new Map<string, number | null>();
    restaurants.forEach((r) => m.set(r.id, 1.11));
    return m;
  }),
}));

describe('API /api/distances GET', () => {
  it('returns distances object for all restaurants, with userAddress override', async () => {
    const mod = await import('./route');
    const req = new MockNextRequest(
      'GET',
      'http://localhost/api/distances?userAddress=Custom Address'
    );
    const res = await mod.GET(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const body = await res.json();
    // Body should be an object with at least one key and numeric values
    const keys = Object.keys(body);
    expect(keys.length).toBeGreaterThan(0);
    expect(typeof body[keys[0]] === 'number' || body[keys[0]] === null).toBe(true);
  });
});
