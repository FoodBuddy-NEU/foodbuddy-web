import { render, screen } from '@testing-library/react';
import { cookies } from 'next/headers';
import RootLayout from './layout';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme">{children}</div>,
}));

jest.mock('@/lib/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth">{children}</div>,
}));

jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

describe('RootLayout', () => {
  const mockedCookies = cookies as jest.Mock;

  beforeEach(() => {
    mockedCookies.mockReset();
    mockedCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'light' }),
    });
  });

  it('wraps children with Theme and Auth providers', async () => {
    const element = await RootLayout({ children: <div data-testid="child">content</div> });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(element as unknown as React.ReactElement);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('theme')).toBeInTheDocument();
    expect(screen.getByTestId('auth')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});