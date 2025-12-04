import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';

jest.mock('@/components/ThemeToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="theme-toggle">toggle</div>,
}));

describe('Header', () => {
  it('renders site name, nav links, and theme toggle', () => {
    render(<Header />);
    expect(screen.getByText('FoodBuddy')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bookmarks/i })).toBeInTheDocument();
    // Two ThemeToggle instances: one for desktop, one for mobile
    expect(screen.getAllByTestId('theme-toggle')).toHaveLength(2);
  });

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Initially, mobile menu should be closed
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    
    // Click to open mobile menu
    fireEvent.click(menuButton);
    
    // Should show aria-expanded="true"
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click again to close
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });
});