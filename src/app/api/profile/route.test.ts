// path: src/app/api/profile/route.test.ts
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import type { NextRequest } from 'next/server';

jest.mock('@/lib/userProfile', () => ({
  getUserProfile: jest.fn(async (uid: string) =>
    uid === 'u1' ? { userId: 'u1', username: 'User', email: 'u1@example.com' } : null
  ),
  updateUserProfile: jest.fn(async () => {}),
}));

describe('/api/profile', () => {
  test('GET returns 400 when missing userId', async () => {
    const { GET } = await import('./route');
    const req = { url: 'http://localhost/api/profile' } as unknown as NextRequest;
    const res = await GET(req as unknown as NextRequest);
    expect(res.status).toBe(400);
  });

  test('GET returns profile when found', async () => {
    const { GET } = await import('./route');
    const req = { url: 'http://localhost/api/profile?userId=u1' } as unknown as NextRequest;
    const res = await GET(req as unknown as NextRequest);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe('u1');
  });

  test('PUT updates and returns success', async () => {
    const { PUT } = await import('./route');
    const req = {
      json: async () => ({ userId: 'u1', username: 'New', avatarUrl: 'http://img' }),
    } as unknown as NextRequest;
    const res = await PUT(req as unknown as NextRequest);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
