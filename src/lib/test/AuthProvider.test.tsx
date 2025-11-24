/* AuthProvider.test.tsx */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthProvider';

jest.mock('@/lib/firebaseClient', () => ({ auth: {} }));

// Configurable auth mock without resetting modules
let mockUser: { email?: string } | null = { email: 'test@example.com' };
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    // Invoke immediately to avoid timing flakiness
    cb(mockUser as unknown);
    return () => {};
  },
}));

function Reader() {
  const { user, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="email">{(user as { email?: string } | null)?.email || 'none'}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    mockUser = { email: 'test@example.com' };
  });

  it('provides user after auth state changes', async () => {
    render(
      <AuthProvider>
        <Reader />
      </AuthProvider>
    );
    // Wait for the user to be provided, then assert final loading state
    const emailText = await screen.findByText('test@example.com');
    expect(emailText).toBeTruthy();
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('handles null user', async () => {
    mockUser = null;

    render(
      <AuthProvider>
        <Reader />
      </AuthProvider>
    );
    const emailEl = await screen.findByTestId('email');
    expect(emailEl.textContent).toBe('none');
  });
});
