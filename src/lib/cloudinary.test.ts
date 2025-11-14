/* cloudinary.test.ts */

describe('cloudinary configuration', () => {
  const originalEnv = process.env;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    process.env = originalEnv;
  });

  it('configures via individual env vars', async () => {
    jest.mock('cloudinary', () => {
      let cfg: Record<string, unknown> = {};
      const config = jest.fn((opts?: Record<string, unknown>) => {
        if (opts) cfg = { ...opts };
        return cfg;
      });
      return { v2: { config, api: { resources: jest.fn() } } };
    });

    process.env.CLOUDINARY_API_KEY = 'key123';
    process.env.CLOUDINARY_API_SECRET = 'secret456';
    process.env.CLOUDINARY_CLOUD_NAME = 'mycloud';

    const cloudinary = (await import('./cloudinary')).default;
    const cfg = (cloudinary as unknown as { config: () => Record<string, unknown> }).config();

    expect(cfg).toMatchObject({
      cloud_name: 'mycloud',
      api_key: 'key123',
      api_secret: 'secret456',
      secure: true,
    });
  });

  it('configures via CLOUDINARY_URL with valid protocol', async () => {
    jest.mock('cloudinary', () => {
      let cfg: Record<string, unknown> = {};
      const config = jest.fn((opts?: Record<string, unknown>) => {
        if (opts) cfg = { ...opts };
        return cfg;
      });
      return { v2: { config, api: { resources: jest.fn() } } };
    });

    process.env.CLOUDINARY_URL = 'cloudinary://aKey:bSecret@my-cloud';

    const cloudinary = (await import('./cloudinary')).default;
    const cfg = (cloudinary as unknown as { config: () => Record<string, unknown> }).config();

    expect(cfg).toMatchObject({
      cloud_name: 'my-cloud',
      api_key: 'aKey',
      api_secret: 'bSecret',
      secure: true,
    });
  });

  it('logs error for invalid CLOUDINARY_URL protocol', async () => {
    jest.mock('cloudinary', () => {
      let cfg: Record<string, unknown> = {};
      const config = jest.fn((opts?: Record<string, unknown>) => {
        if (opts) cfg = { ...opts };
        return cfg;
      });
      return { v2: { config, api: { resources: jest.fn() } } };
    });

    process.env.CLOUDINARY_URL = 'http://bad-protocol';

    const cloudinary = (await import('./cloudinary')).default;
    const cfg = (cloudinary as unknown as { config: () => Record<string, unknown> }).config();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(cfg).toEqual({});
  });

  it('logs debug when no configuration is present', async () => {
    jest.mock('cloudinary', () => {
      let cfg: Record<string, unknown> = {};
      const config = jest.fn((opts?: Record<string, unknown>) => {
        if (opts) cfg = { ...opts };
        return cfg;
      });
      return { v2: { config, api: { resources: jest.fn() } } };
    });

    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_URL;

    const cloudinary = (await import('./cloudinary')).default;
    const cfg = (cloudinary as unknown as { config: () => Record<string, unknown> }).config();

    expect(consoleDebugSpy).toHaveBeenCalled();
    expect(cfg).toEqual({});
  });
});