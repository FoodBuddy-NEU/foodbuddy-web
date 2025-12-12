/* ThemeProvider.test.tsx */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeProvider';

function Consumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  it('defaults to light on initial render', async () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe('light');
      expect(localStorage.getItem('theme')).toBeNull();
    });
  });

  it('ignores existing stored dark theme values', async () => {
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe('light');
      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });

  it('toggles theme in memory only', async () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('light');
      expect(localStorage.getItem('theme')).toBeNull();
    });

    fireEvent.click(screen.getByText('Toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe('light');
      expect(localStorage.getItem('theme')).toBeNull();
    });
  });

  it('throws when useTheme is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    function InvalidConsumer() {
      useTheme();
      return null;
    }

    expect(() => render(<InvalidConsumer />)).toThrow('useTheme must be used within ThemeProvider');
    consoleError.mockRestore();
  });
});