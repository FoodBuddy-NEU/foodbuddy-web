import { render, screen } from '@testing-library/react';
import RootLayout from './layout';

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
  it('wraps children with Theme and Auth providers', () => {
    const element = RootLayout({ children: <div data-testid="child">content</div> });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(element as unknown as React.ReactElement);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('theme')).toBeInTheDocument();
    expect(screen.getByTestId('auth')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});