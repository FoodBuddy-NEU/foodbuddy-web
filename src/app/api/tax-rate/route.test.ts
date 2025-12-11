/**
 * @jest-environment node
 */

// Mock OpenAI before any imports
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({ taxRate: 0.0925, source: 'OpenAI' }),
              },
            },
          ],
        }),
      },
    },
  }));
});

describe('Tax Rate API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Clear module cache to reset the taxRateCache
    jest.resetModules();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns 400 when zipCode is missing', async () => {
    const { GET } = await import('./route');
    
    const url = new URL('http://localhost:3000/api/tax-rate');
    const request = {
      url: url.toString(),
      nextUrl: url,
    } as any;
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Zip code is required');
  });

  test('returns default rate when OPENAI_API_KEY is not set', async () => {
    delete process.env.OPENAI_API_KEY;
    
    const { GET } = await import('./route');
    
    const url = new URL('http://localhost:3000/api/tax-rate?zipCode=94704');
    const request = {
      url: url.toString(),
      nextUrl: url,
    } as any;
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.taxRate).toBe(0.0875);
    expect(data.zipCode).toBe('94704');
    expect(data.default).toBe(true);
  });

  test('returns rate for valid zipCode with API key', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    const { GET } = await import('./route');
    
    const url = new URL('http://localhost:3000/api/tax-rate?zipCode=02115');
    const request = {
      url: url.toString(),
      nextUrl: url,
    } as any;
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.zipCode).toBe('02115');
    expect(typeof data.taxRate).toBe('number');
  });

  test('handles different zip codes', async () => {
    const { GET } = await import('./route');
    
    const url = new URL('http://localhost:3000/api/tax-rate?zipCode=10001');
    const request = {
      url: url.toString(),
      nextUrl: url,
    } as any;
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.zipCode).toBe('10001');
  });
});