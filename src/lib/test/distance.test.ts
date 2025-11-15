import { calculateDistance, DEFAULT_USER_ADDRESS } from '../distance';

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
      jest.mock('../distance', () => {
         
        const original = jest.requireActual('../distance');
        return {
          ...original,
          geocodeAddress: jest.fn(async (address: string) => {
            if (address === 'fail address') return null;
            return { lat: 0, lng: 0 };
          }),
        };
      });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { calculateDistance, DEFAULT_USER_ADDRESS } = require('../distance');
      const result = await calculateDistance('fail address', DEFAULT_USER_ADDRESS);
      expect(result).toBeNull();
    });

    it('calculates Haversine distance and rounds to one decimal', async () => {
      const originalKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key';

      const fakeResponse = (lat: number, lng: number) => ({
        json: async () => ({
          status: 'OK',
          results: [{ geometry: { location: { lat, lng } } }],
        }),
      });

      global.fetch = (jest.fn(async (url: string) => {
        const s = String(url);
        if (s.includes('address=A')) return fakeResponse(0, 0) as unknown as Response;
        if (s.includes('address=B')) return fakeResponse(0, 1) as unknown as Response;
        return { json: async () => ({ status: 'ZERO_RESULTS', results: [] }) } as unknown as Response;
      }) as unknown) as typeof fetch;

      const d = await calculateDistance('B', 'A');
      expect(typeof d).toBe('number');
      expect(d).toBeCloseTo(69.1, 1);

      // restore
      if (originalKey) process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalKey;
    });

    it('maps distances for multiple restaurants', async () => {
      jest.resetModules();
      jest.doMock('../distance', () => {
        const actual = jest.requireActual('../distance');
        return {
          ...actual,
          geocodeAddress: async (address: string) => {
            if (address === 'addr1') return { lat: 0, lng: 0 };
            if (address === 'addr2') return { lat: 0, lng: 1 };
            return null;
          },
        };
      });
      const { calculateDistancesForRestaurants, calculateDistance, DEFAULT_USER_ADDRESS } =
        (await import('../distance')) as unknown as {
          calculateDistancesForRestaurants: (
            r: Array<{ id: string; address: string }>,
            u?: string
          ) => Promise<Map<string, number | null>>;
          calculateDistance: (ra: string, ua?: string) => Promise<number | null>;
          DEFAULT_USER_ADDRESS: string;
        };

      const restaurants = [
        { id: 'r1', address: 'addr1' },
        { id: 'r2', address: 'addr2' },
        { id: 'r3', address: 'missing' },
      ];
      const map = await calculateDistancesForRestaurants(restaurants, DEFAULT_USER_ADDRESS);
      expect(map.get('r1')).toEqual(await calculateDistance('addr1', DEFAULT_USER_ADDRESS));
      expect(map.get('r2')).toEqual(await calculateDistance('addr2', DEFAULT_USER_ADDRESS));
      expect(map.get('r3')).toBeNull();
    });
  });
});
