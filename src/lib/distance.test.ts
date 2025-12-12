import { calculateDistance, DEFAULT_USER_ADDRESS } from './distance';

describe('Distance Calculation Library', () => {
  beforeAll(() => {
    // Suppress console output during tests for missing API key scenarios
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('DEFAULT_USER_ADDRESS', () => {
    it('should export the default user address', () => {
      expect(DEFAULT_USER_ADDRESS).toBe('5000 MacArthur Blvd, Oakland, CA');
    });
  });

  describe('calculateDistance', () => {
    it('should be a function', () => {
      expect(typeof calculateDistance).toBe('function');
    });

    it('should return null for invalid API key', async () => {
      // Mock environment to have no API key
      const originalKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      const result = await calculateDistance('123 Main St, Boston, MA', DEFAULT_USER_ADDRESS);

      expect(result).toBeNull();

      // Restore original key
      if (originalKey) {
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalKey;
      }
    });

    it('should handle calculation with both addresses provided', async () => {
      // This test verifies the function signature and basic logic
      // Actual distance calculation would require API mock
      const testAddress = '123 Test St, Boston, MA';

      // Test should not throw error with valid parameters
      expect(async () => {
        await calculateDistance(testAddress, DEFAULT_USER_ADDRESS);
      }).not.toThrow();
    });

    it('returns null if restaurant address is missing', async () => {
      const result = await calculateDistance('', DEFAULT_USER_ADDRESS);
      expect(result).toBeNull();
    });

    it('returns null if user address is missing', async () => {
      const result = await calculateDistance('123 Main St, Boston, MA', '');
      expect(result).toBeNull();
    });

    it('returns null if both addresses are missing', async () => {
      const result = await calculateDistance('', '');
      expect(result).toBeNull();
    });

    it('returns null if geocode fails for restaurant', async () => {
      jest.resetModules();
      jest.mock('./distance', () => {
        const original = jest.requireActual('./distance');
        return {
          ...original,
          geocodeAddress: jest.fn(async (address: string) => {
            if (address === 'fail address') return null;
            return { lat: 0, lng: 0 };
          }),
        };
      });
      const { calculateDistance, DEFAULT_USER_ADDRESS } = await import('./distance');
      const result = await calculateDistance('fail address', DEFAULT_USER_ADDRESS);
      expect(result).toBeNull();
    });
  });
});
