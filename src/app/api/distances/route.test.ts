/* distances route.test.ts */

import { MockNextRequest, MockNextResponse } from '../__test_setup__/testServer';

jest.mock('next/server', () => {
  return { NextResponse: MockNextResponse };
});

jest.mock('@/lib/distance', () => ({
  DEFAULT_USER_ADDRESS: '5000 MacArthur Blvd, Oakland, CA',
  calculateDistancesForRestaurants: jest.fn(async (restaurants: Array<{ id: string }>) => {
    const m = new Map<string, number | null>();
    restaurants.forEach((r) => m.set(r.id, 1.23));
    return m;
  }),
}));

describe('API /api/distances', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('POST returns distances object', async () => {
    const mod = await import('./route');
    const req = new MockNextRequest('POST', 'http://localhost/api/distances', {}, {
      addresses: ['a', 'b'],
      userAddress: 'Some Address',
    });
    const res = await mod.POST(req as unknown as import('next/server').NextRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ a: 1.23, b: 1.23 });
  });

  it('POST validates addresses array', async () => {
    const mod = await import('./route');
    const req = new MockNextRequest('POST', 'http://localhost/api/distances', {}, {
      addresses: 'not-an-array',
    });
    const res = await mod.POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});