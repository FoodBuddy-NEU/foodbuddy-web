/* firebaseClient.test.ts */

describe('firebaseClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('initializes app when none exists', async () => {
    const initializeApp = jest.fn(() => ({ name: 'app1' }));
    const getApps = jest.fn(() => []);
    const getAuth = jest.fn(() => ({ auth: true }));
    const getFirestore = jest.fn(() => ({ db: true }));

    jest.mock('firebase/app', () => ({
      initializeApp,
      getApps,
    }));
    jest.mock('firebase/auth', () => ({ getAuth }));
    jest.mock('firebase/firestore', () => ({ getFirestore }));

    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'k';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'auth.domain';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'pid';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'appid';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'bucket';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'sender';

    const mod = await import('../firebaseClient');
    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: 'k',
      authDomain: 'auth.domain',
      projectId: 'pid',
      appId: 'appid',
      storageBucket: 'bucket',
      messagingSenderId: 'sender',
    });
    expect(getAuth).toHaveBeenCalled();
    expect(getFirestore).toHaveBeenCalled();

    expect(mod.app).toEqual({ name: 'app1' });
    expect(mod.auth).toEqual({ auth: true });
    expect(mod.db).toEqual({ db: true });
  });

  it('reuses existing app when present', async () => {
    const existingApp = { name: 'existing' };
    const getApps = jest.fn(() => [existingApp]);
    const initializeApp = jest.fn();
    const getAuth = jest.fn(() => ({ auth: true }));
    const getFirestore = jest.fn(() => ({ db: true }));

    jest.mock('firebase/app', () => ({ getApps, initializeApp }));
    jest.mock('firebase/auth', () => ({ getAuth }));
    jest.mock('firebase/firestore', () => ({ getFirestore }));

    const mod = await import('../firebaseClient');
    expect(initializeApp).not.toHaveBeenCalled();
    expect(mod.app).toBe(existingApp);
    expect(getAuth).toHaveBeenCalledWith(existingApp);
    expect(getFirestore).toHaveBeenCalledWith(existingApp);
  });
});