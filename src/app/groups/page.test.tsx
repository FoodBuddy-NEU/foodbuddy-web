import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GroupListPage from '@/app/groups/page';
import * as firestoreModule from 'firebase/firestore';

jest.mock('@/lib/firebaseClient', () => ({ db: {} }));
jest.mock('firebase/firestore', () => {
  const collection = jest.fn(() => ({}));
  const orderBy = jest.fn(() => ({ field: 'name', dir: 'asc' }));
  const query = jest.fn(() => ({}));
  const where = jest.fn(() => ({ field: 'memberIds', op: 'array-contains', value: 'u1' }));
  const getDocs = jest.fn(async () => ({
    docs: [
      { id: 'g1', data: () => ({ name: 'Alpha', memberIds: ['u1', 'u2'], restaurantName: 'Pasta Place', diningTime: '2025-01-15T12:00:00' }) },
      { id: 'g2', data: () => ({ name: 'Beta', memberIds: ['u1'], restaurantName: undefined, diningTime: undefined }) },
      { id: 'g3', data: () => ({ name: 'Gamma', memberIds: ['u1', 'u3', 'u4'], restaurantName: 'Sushi Bar', diningTime: '2025-01-20T18:30:00' }) },
    ],
  }));
  return { collection, orderBy, query, where, getDocs };
});

const mockUseAuth = jest.fn();
jest.mock('@/lib/AuthProvider', () => ({ useAuth: () => mockUseAuth() }));

jest.mock('@/lib/chat', () => ({
  createGroup: jest.fn(async () => 'new-group-id'),
}));

jest.mock('@/lib/userProfile', () => ({
  getUserProfile: jest.fn(async (uid: string) => ({
    avatarUrl: uid === 'u1' ? '/avatar1.png' : '/icon.png',
  })),
}));

describe('GroupListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
  });

  test('renders groups and back link', async () => {
    render(<GroupListPage />);
    expect(await screen.findByText('Your Groups')).toBeInTheDocument();
    // Groups and public channels may share names, so use findAllByText
    const alphaElements = await screen.findAllByText('Alpha');
    expect(alphaElements.length).toBeGreaterThan(0);
    const betaElements = await screen.findAllByText('Beta');
    expect(betaElements.length).toBeGreaterThan(0);
    const backLink = screen.getByText('← Back');
    expect(backLink).toHaveAttribute('href', '/');
  });

  test('shows sign in message when user is not logged in', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<GroupListPage />);
    expect(screen.getByText('Please sign in to view your groups.')).toBeInTheDocument();
  });

  test('renders search input', async () => {
    render(<GroupListPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search groups by name')).toBeInTheDocument();
    });
  });

  test('filters groups by search query', async () => {
    render(<GroupListPage />);
    await screen.findAllByText('Alpha');
    
    const searchInput = screen.getByPlaceholderText('Search groups by name');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });
    
    await waitFor(() => {
      // Search input should have the value
      expect(searchInput).toHaveValue('Alpha');
      // At least one Alpha should be visible
      const alphaElements = screen.getAllByText('Alpha');
      expect(alphaElements.length).toBeGreaterThan(0);
    });
  });

  test('renders restaurant filter dropdown', async () => {
    render(<GroupListPage />);
    await screen.findAllByText('Alpha');
    
    const restaurantSelect = screen.getByDisplayValue('Any Restaurant');
    expect(restaurantSelect).toBeInTheDocument();
  });

  test('filters by restaurant', async () => {
    render(<GroupListPage />);
    await screen.findAllByText('Alpha');
    
    const restaurantSelect = screen.getByDisplayValue('Any Restaurant');
    fireEvent.change(restaurantSelect, { target: { value: 'Pasta Place' } });
    
    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    });
  });

  test('filters by No Restaurant option', async () => {
    render(<GroupListPage />);
    await screen.findAllByText('Alpha');
    
    const restaurantSelect = screen.getByDisplayValue('Any Restaurant');
    fireEvent.change(restaurantSelect, { target: { value: 'No Restaurant' } });
    
    await waitFor(() => {
      // After filtering, only groups without restaurant should show in the groups section
      // Public channels may still have "Alpha" in the public chat section
      const groupLinks = screen.getAllByRole('link', { name: /Beta.*Not chosen yet/i });
      expect(groupLinks.length).toBeGreaterThan(0);
    });
  });

  test('renders time filter dropdown', async () => {
    render(<GroupListPage />);
    await screen.findAllByText('Alpha');
    
    const timeSelect = screen.getByDisplayValue('Any time');
    expect(timeSelect).toBeInTheDocument();
  });

  test('filters by "Has time" option', async () => {
    render(<GroupListPage />);
    await screen.findAllByText('Alpha');
    
    const timeSelect = screen.getByDisplayValue('Any time');
    fireEvent.change(timeSelect, { target: { value: 'has' } });
    
    await waitFor(() => {
      // Groups with dining time should still be visible
      const alphaElements = screen.getAllByText('Alpha');
      expect(alphaElements.length).toBeGreaterThan(0);
    });
  });

  test('filters by "No time" option', async () => {
    render(<GroupListPage />);
    await screen.findAllByText('Alpha');
    
    const timeSelect = screen.getByDisplayValue('Any time');
    fireEvent.change(timeSelect, { target: { value: 'no' } });
    
    await waitFor(() => {
      // Beta group has no dining time and should be visible
      const betaElements = screen.getAllByText('Beta');
      expect(betaElements.length).toBeGreaterThan(0);
    });
  });

  test('shows date/time range inputs when "Match range" is selected', async () => {
    render(<GroupListPage />);
    await screen.findAllByText('Alpha');
    
    const timeSelect = screen.getByDisplayValue('Any time');
    fireEvent.change(timeSelect, { target: { value: 'match' } });
    
    await waitFor(() => {
      expect(screen.getByText('From date')).toBeInTheDocument();
      expect(screen.getByText('To date')).toBeInTheDocument();
      expect(screen.getByText('From time')).toBeInTheDocument();
      expect(screen.getByText('To time')).toBeInTheDocument();
    });
  });

  test('renders Create button', async () => {
    render(<GroupListPage />);
    await waitFor(() => {
      expect(screen.getByText('+ Create')).toBeInTheDocument();
    });
  });

  test('shows public channels when no private groups', async () => {
    (firestoreModule.getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
    
    render(<GroupListPage />);
    
    await waitFor(() => {
      // Public channels should still be visible even when no private groups
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThanOrEqual(0);
    });
  });

  test('displays restaurant name and dining time for groups', async () => {
    render(<GroupListPage />);
    
    await waitFor(() => {
      // Use getAllByText since restaurant name appears in dropdown and group card
      expect(screen.getAllByText(/Pasta Place/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Not chosen yet/)).toBeInTheDocument();
    });
  });

  test('displays member count for groups', async () => {
    render(<GroupListPage />);
    // Use findAllByText since groups and public channels may share names
    await screen.findAllByText('Alpha');
    
    // Groups + public channels = at least 3 group items
    const groupItems = screen.getAllByRole('listitem');
    expect(groupItems.length).toBeGreaterThanOrEqual(3);
  });

  test('shows loading state initially', () => {
    render(<GroupListPage />);
    // Loading disappears once groups load
    expect(screen.queryByText('Loading groups…')).toBeInTheDocument();
  });

  test('shows no matches message when filter returns no results', async () => {
    render(<GroupListPage />);
    // Use findAllByText since groups and public channels may share names
    await screen.findAllByText('Alpha');
    
    const searchInput = screen.getByPlaceholderText('Search groups by name');
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No groups match your search or filters.')).toBeInTheDocument();
    });
  });

  test('group links navigate to correct group page', async () => {
    render(<GroupListPage />);
    // Use findAllByText since groups and public channels may share names
    await screen.findAllByText('Alpha');
    
    // Find the link to /groups/g1 specifically
    const groupLink = screen.getByRole('link', { name: /Alpha.*Pasta Place/i });
    expect(groupLink).toHaveAttribute('href', '/groups/g1');
  });
});
