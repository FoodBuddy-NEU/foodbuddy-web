/* restaurants route.test.ts */

import { MockNextResponse } from '../__test_setup__/testServer';

jest.mock('next/server', () => {
  return { NextResponse: MockNextResponse };
});

describe('API /api/restaurants', () => {
  it('GET returns restaurants data', async () => {
    const mod = await import('./route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(typeof body[0]).toBe('object');
  });
});