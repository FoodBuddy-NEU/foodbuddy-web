import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Header from '../Header';

jest.mock('@/components/ThemeToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="theme-toggle">toggle</div>,
}));

describe('Header', () => {
  it('renders site name, nav links, and theme toggle', async () => {
    render(<Header />);
    
    // Check for site name
    expect(screen.getByText('FoodBuddy')).toBeInTheDocument();
    
    // Check for nav links
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bookmarks/i })).toBeInTheDocument();
    
    // Two ThemeToggle instances: one for desktop, one for mobile
    await waitFor(() => {
      expect(screen.getAllByTestId('theme-toggle')).toHaveLength(2);
    });
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

  it('shows mobile menu links when opened', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Open mobile menu
    fireEvent.click(menuButton);
    
    // Should show all navigation links in mobile menu
    const homeLinks = screen.getAllByRole('link', { name: /home/i });
    const bookmarksLinks = screen.getAllByRole('link', { name: /bookmarks/i });
    const friendsLinks = screen.getAllByRole('link', { name: /friends/i });
    const groupChatLinks = screen.getAllByRole('link', { name: /group chat/i });
    const profileLinks = screen.getAllByRole('link', { name: /profile/i });
    
    // Each should appear twice (desktop + mobile)
    expect(homeLinks.length).toBeGreaterThanOrEqual(2);
    expect(bookmarksLinks.length).toBeGreaterThanOrEqual(2);
    expect(friendsLinks.length).toBeGreaterThanOrEqual(2);
    expect(groupChatLinks.length).toBeGreaterThanOrEqual(2);
    expect(profileLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('closes mobile menu when a link is clicked', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Open mobile menu
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click on a mobile menu link (get the last one which should be in mobile menu)
    const homeLinks = screen.getAllByRole('link', { name: /home/i });
    const mobileHomeLink = homeLinks[homeLinks.length - 1];
    fireEvent.click(mobileHomeLink);
    
    // Menu should close
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders Friends link in navigation', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /friends/i })).toBeInTheDocument();
  });

  it('renders Group Chat link in navigation', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /group chat/i })).toBeInTheDocument();
  });

  it('renders Profile link in navigation', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
  });

  it('has correct href for all navigation links', () => {
    render(<Header />);
    
    expect(screen.getByRole('link', { name: 'FoodBuddy' })).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('link', { name: /home/i })[0]).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('link', { name: /bookmarks/i })[0]).toHaveAttribute('href', '/bookmarks');
    expect(screen.getAllByRole('link', { name: /friends/i })[0]).toHaveAttribute('href', '/friends');
    expect(screen.getAllByRole('link', { name: /group chat/i })[0]).toHaveAttribute('href', '/groups');
    expect(screen.getAllByRole('link', { name: /profile/i })[0]).toHaveAttribute('href', '/profile');
  });
});

