// path: src/lib/firebaseAdmin.test.ts
describe('firebaseAdmin init', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('initializes with cert when FIREBASE_SERVICE_ACCOUNT is set', async () => {
    const initializeApp = jest.fn();
    const cert = jest.fn(() => 'CERT');
    const applicationDefault = jest.fn(() => 'DEFAULT');
    const auth = jest.fn(() => ({ adminAuth: true }));
    const firestore = jest.fn(() => ({ adminDb: true }));

    jest.mock('firebase-admin', () => ({
      __esModule: true,
      default: {
        apps: [],
        initializeApp,
        credential: { cert, applicationDefault },
        auth,
        firestore,
      },
    }));

    process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'pid' });

    const mod = await import('../firebaseAdmin');
    expect(initializeApp).toHaveBeenCalledWith({ credential: 'CERT' });
    expect(mod.auth).toEqual({ adminAuth: true });
    expect(mod.db).toEqual({ adminDb: true });
  });

  test('initializes with applicationDefault when no service account', async () => {
    const initializeApp = jest.fn();
    const cert = jest.fn(() => 'CERT');
    const applicationDefault = jest.fn(() => 'DEFAULT');
    const auth = jest.fn(() => ({}));
    const firestore = jest.fn(() => ({}));

    jest.mock('firebase-admin', () => ({
      __esModule: true,
      default: {
        apps: [],
        initializeApp,
        credential: { cert, applicationDefault },
        auth,
        firestore,
      },
    }));

    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

    const mod = await import('../firebaseAdmin');
    expect(initializeApp).toHaveBeenCalledWith({ credential: 'DEFAULT' });
    expect(mod.auth).toBeDefined();
    expect(mod.db).toBeDefined();
  });

  test('reuses existing app', async () => {
    const initializeApp = jest.fn();
    const auth = jest.fn(() => ({}));
    const firestore = jest.fn(() => ({}));

    jest.mock('firebase-admin', () => ({
      __esModule: true,
      default: {
        apps: [{}],
        initializeApp,
        credential: { cert: jest.fn(), applicationDefault: jest.fn() },
        auth,
        firestore,
      },
    }));

    const mod = await import('../firebaseAdmin');
    expect(initializeApp).not.toHaveBeenCalled();
    expect(mod.auth).toBeDefined();
    expect(mod.db).toBeDefined();
  });
});