import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'stream/web';
import { act } from 'react';

// Polyfill TextEncoder/TextDecoder for Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;

// Suppress fetch warnings in tests
global.fetch = jest.fn();

// Provide matchMedia for ThemeProvider in JSDOM
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Ensure MutationObserver callbacks run within React act to avoid warnings
if (typeof window !== 'undefined' && window.MutationObserver) {
  const OriginalMutationObserver = window.MutationObserver;
  window.MutationObserver = class extends OriginalMutationObserver {
    constructor(callback) {
      super((mutations, observer) => {
        act(() => callback(mutations, observer));
      });
    }
  };
}

// Mock Firebase environment variables for tests
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
}
if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
}
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';
}
if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) {
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
}
if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
}
if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
}
if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-api-key';
}
