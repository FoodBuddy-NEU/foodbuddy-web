// path: src/app/api/auth/verify-and-update-email/route.test.ts
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));
import type { NextRequest } from 'next/server';
import { verificationCodes } from '@/lib/verificationStore';

jest.mock('@/lib/firebaseAdmin', () => ({
  auth: { updateUser: jest.fn(async () => {}) },
}));

describe('POST /api/auth/verify-and-update-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verificationCodes.clear();
  });

  test('rejects missing fields', async () => {
    const { POST } = await import('./route');
    const req = { json: async () => ({}) } as unknown as NextRequest;
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing required fields/);
  });

  test('rejects invalid or expired code', async () => {
    const { POST } = await import('./route');

    verificationCodes.set('bad@example.com', {
      code: '123456',
      timestamp: Date.now() - 11 * 60 * 1000,
    });
    let req = {
      json: async () => ({ userId: 'u1', newEmail: 'bad@example.com', verificationCode: '123456' }),
    } as unknown as NextRequest;
    let res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect(verificationCodes.has('bad@example.com')).toBe(false);

    verificationCodes.set('new@example.com', { code: '999999', timestamp: Date.now() });
    req = {
      json: async () => ({ userId: 'u1', newEmail: 'new@example.com', verificationCode: '000000' }),
    } as unknown as NextRequest;
    res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Invalid verification code/);
    expect(verificationCodes.has('new@example.com')).toBe(true);
  });

  test('updates email on valid code and cleans up store', async () => {
    const { POST } = await import('./route');
    const { auth } = await import('@/lib/firebaseAdmin');

    verificationCodes.set('ok@example.com', { code: '123456', timestamp: Date.now() });
    const req = {
      json: async () => ({ userId: 'u1', newEmail: 'ok@example.com', verificationCode: '123456' }),
    } as unknown as NextRequest;
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(auth.updateUser as jest.Mock).toHaveBeenCalledWith('u1', { email: 'ok@example.com' });
    expect(verificationCodes.has('ok@example.com')).toBe(false);
  });
});
