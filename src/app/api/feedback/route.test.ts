/* feedback route.test.ts */

import { MockNextRequest, MockNextResponse } from '../__test_setup__/testServer';

jest.mock('next/server', () => {
  return { NextResponse: MockNextResponse };
});

const addMock = jest.fn(async () => ({ id: 'fb123' }));
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => [{}]), // Pretend app already initialized
  cert: jest.fn(),
}));
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({ add: addMock })),
  })),
}));

describe('API /api/feedback', () => {
  let warnSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.resetModules();
    addMock.mockClear();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns 400 for invalid JSON', async () => {
    const mod = await import('./route');
    const badReq = {
      json: async () => {
        throw new Error('bad json');
      },
    } as unknown as import('next/server').NextRequest;

    const res = await mod.POST(badReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Invalid JSON format');
  });

  it('returns 400 for missing required fields', async () => {
    const mod = await import('./route');
    const req = new MockNextRequest(
      'POST',
      'http://localhost/api/feedback',
      {},
      {
        restaurantId: '',
        restaurantName: '',
        userEmail: '',
        userName: '',
        feedbackType: '',
        feedbackContent: '',
      }
    );
    const res = await mod.POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Missing required fields');
  });

  it('stores feedback and returns success', async () => {
    const mod = await import('./route');
    const req = new MockNextRequest(
      'POST',
      'http://localhost/api/feedback',
      {},
      {
        restaurantId: 'r1',
        restaurantName: 'Test',
        userEmail: 'a@b.com',
        userName: 'Alice',
        feedbackType: 'menu',
        feedbackContent: 'New items',
      }
    );
    const res = await mod.POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, feedbackId: 'fb123' });
    expect(addMock).toHaveBeenCalled();
  });

  afterEach(() => {
    warnSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('returns 500 when Firestore is not initialized', async () => {
    jest.resetModules();
    jest.doMock('firebase-admin/app', () => ({
      initializeApp: jest.fn(),
      getApps: jest.fn(() => []), // Force init path
      cert: jest.fn(),
    }));
    jest.doMock('firebase-admin/firestore', () => ({
      getFirestore: jest.fn(() => null), // No DB
    }));

    const mod = await import('./route');
    const req = new MockNextRequest(
      'POST',
      'http://localhost/api/feedback',
      {},
      {
        restaurantId: 'r1',
        restaurantName: 'X',
        userEmail: 'x@y.com',
        userName: 'Bob',
        feedbackType: 'menu',
        feedbackContent: 'content',
      }
    );

    const res = await mod.POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Database service not available');
  });
});
