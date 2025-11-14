import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ThemeToggle from './ThemeToggle';

const mockToggleTheme = jest.fn();
let themeValue: 'light' | 'dark' = 'light';

jest.mock('@/lib/ThemeProvider', () => ({
  useTheme: () => ({ theme: themeValue, toggleTheme: mockToggleTheme }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockToggleTheme.mockClear();
    themeValue = 'light';
  });

  it('renders a disabled button before mounted', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
  });

  it('enables after mount and toggles theme on click', async () => {
    render(<ThemeToggle />);

    // Wait for microtask-based mount
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('shows correct label based on theme value', async () => {
    themeValue = 'dark';
    render(<ThemeToggle />);

    await act(async () => { await Promise.resolve(); });
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light theme');
      expect(button.textContent).toContain('🌙 Dark');
    });
  });
});