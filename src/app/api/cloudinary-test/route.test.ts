import { MockNextResponse } from '../__test_setup__/testServer';

jest.mock('next/server', () => {
  return { NextResponse: MockNextResponse };
});

describe('API /api/cloudinary-test GET', () => {
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.resetModules();
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns success with configuration and resources', async () => {
    jest.doMock('@/lib/cloudinary', () => {
      const configVals: Record<string, unknown> = {
        cloud_name: 'my-cloud',
        api_key: 'present',
        api_secret: 'present',
      };
      return {
        __esModule: true,
        default: {
          config: jest.fn(() => configVals),
          api: {
            resources: jest.fn(async () => ({ resources: [{ id: 'res1' }] })),
          },
        },
      };
    });

    const mod = await import('./route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      success: true,
      config: { cloud_name: 'my-cloud', api_key: 'present', api_secret: 'present' },
    });
    expect(Array.isArray(body.resources)).toBe(true);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('returns failure on cloudinary API error', async () => {
    jest.doMock('@/lib/cloudinary', () => {
      return {
        __esModule: true,
        default: {
          config: jest.fn(() => ({ cloud_name: 'my-cloud' })),
          api: {
            resources: jest.fn(async () => {
              throw new Error('boom');
            }),
          },
        },
      };
    });

    const mod = await import('./route');
    const res = await mod.GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({ success: false });
  });
});
