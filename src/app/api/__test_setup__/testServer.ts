/**
 * Test server setup for Next.js API routes
 * Provides a full mocked environment for testing API handlers
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Mock NextRequest and NextResponse for API route testing
export class MockNextRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  nextUrl: { searchParams: Map<string, string> };

  constructor(
    method: string = 'GET',
    url: string = '/',
    headers: Record<string, string> = {},
    body: Record<string, unknown> | null = null
  ) {
    this.method = method;
    this.url = url;
    this.headers = headers;
    this.body = body;

    // Parse URL and searchParams
    const urlObj = new URL(url, 'http://localhost');
    this.nextUrl = {
      searchParams: new Map(urlObj.searchParams),
    };
  }

  async json(): Promise<Record<string, unknown>> {
    return this.body || {};
  }

  async text(): Promise<string> {
    return JSON.stringify(this.body);
  }

  clone(): MockNextRequest {
    return new MockNextRequest(this.method, this.url, this.headers, this.body);
  }
}

// Mock NextResponse
export class MockNextResponse {
  status: number;
  statusText: string;
  headers: Map<string, string>;
  body: Record<string, unknown> | null;

  constructor(
    body: Record<string, unknown> | null = null,
    init?: { status?: number; statusText?: string; headers?: Record<string, string> }
  ) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Map(Object.entries(init?.headers || {}));
  }

  static json(
    data: Record<string, unknown>,
    init?: { status?: number; statusText?: string; headers?: Record<string, string> }
  ): MockNextResponse {
    return new MockNextResponse(data, init);
  }

  async json(): Promise<Record<string, unknown>> {
    return this.body || {};
  }

  async text(): Promise<string> {
    return JSON.stringify(this.body);
  }
}

// Global mocks
export function setupGlobalMocks(): void {
  // Mock global.Request and Response for Next.js
  if (typeof global.Request === 'undefined') {
    (global as Record<string, unknown>).Request = class {
      constructor(..._args: unknown[]) {}
    };
  }

  if (typeof global.Response === 'undefined') {
    (global as Record<string, unknown>).Response = class {
      constructor(..._args: unknown[]) {}
      static json(data: Record<string, unknown>, init?: Record<string, unknown>): MockNextResponse {
        return new MockNextResponse(
          data,
          init as { status?: number; statusText?: string; headers?: Record<string, string> }
        );
      }
      get cookies(): { getSetCookie: () => string[] } {
        return { getSetCookie: () => [] };
      }
    };
  }

  // Mock NextResponse
  if (typeof (global as Record<string, unknown>).NextResponse === 'undefined') {
    (global as Record<string, unknown>).NextResponse = MockNextResponse;
  }
}

// Initialize global mocks on import
setupGlobalMocks();
