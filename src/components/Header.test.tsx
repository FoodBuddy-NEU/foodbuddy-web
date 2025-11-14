import { render, screen } from '@testing-library/react';
import Header from './Header';

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
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });
});