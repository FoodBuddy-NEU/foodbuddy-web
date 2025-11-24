// path: src/lib/verificationStore.test.ts
import { verificationCodes } from '../verificationStore';

describe('verificationStore', () => {
  test('stores and retrieves codes', () => {
    verificationCodes.clear();
    verificationCodes.set('a@example.com', { code: '111111', timestamp: 1 });
    expect(verificationCodes.get('a@example.com')?.code).toBe('111111');
  });

  test('persists in global across imports', async () => {
    verificationCodes.set('b@example.com', { code: '222222', timestamp: 2 });
    const mod = await import('../verificationStore');
    expect(mod.verificationCodes.get('b@example.com')?.code).toBe('222222');
  });
});
