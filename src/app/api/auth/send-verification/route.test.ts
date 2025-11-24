// path: src/app/api/auth/send-verification/route.test.ts
import type { NextRequest } from 'next/server';
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe('POST /api/auth/send-verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock(
      'resend',
      () => ({
        Resend: jest.fn().mockImplementation(() => ({
          emails: { send: jest.fn().mockResolvedValue({ id: 'email-id' }) },
        })),
      }),
      { virtual: true }
    );
    process.env = { ...originalEnv, NODE_ENV: 'development' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('rejects invalid email', async () => {
    const { POST } = await import('./route');
    const req = { json: async () => ({ email: 'invalid' }) } as unknown as NextRequest;
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid email/);
  });

  test('sends code and returns success with dev code', async () => {
    const { POST } = await import('./route');
    const req = { json: async () => ({ email: 'user@example.com' }) } as unknown as NextRequest;
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/Verification code sent/);
    expect(body.code).toMatch(/\d{6}/);
  });

  test('handles email send failure', async () => {
    jest.doMock(
      'resend',
      () => ({
        Resend: jest.fn().mockImplementation(() => ({
          emails: { send: jest.fn().mockRejectedValue(new Error('send failed')) },
        })),
      }),
      { virtual: true }
    );
    const { POST } = await import('./route');
    const req = { json: async () => ({ email: 'user@example.com' }) } as unknown as NextRequest;
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/Failed to send verification code/);
  });
});
