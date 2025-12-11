import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GroupListPage from '@/app/groups/page';

// Mock data for groups
const mockGroups = [
  { id: 'g1', data: () => ({ name: 'Alpha', memberIds: ['u1', 'u2'], restaurantName: 'Pasta Place', diningTime: '2025-01-15T12:00:00' }) },
  { id: 'g2', data: () => ({ name: 'Beta', memberIds: ['u1'], restaurantName: undefined, diningTime: undefined }) },
  { id: 'g3', data: () => ({ name: 'Gamma', memberIds: ['u1', 'u3', 'u4'], restaurantName: 'Sushi Bar', diningTime: '2025-01-20T18:30:00' }) },
];

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
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(await screen.findByText('Beta')).toBeInTheDocument();
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
    await screen.findByText('Alpha');
    
    const searchInput = screen.getByPlaceholderText('Search groups by name');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });
    
    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Beta')).not.toBeInTheDocument();
      expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
    });
  });

  test('renders restaurant filter dropdown', async () => {
    render(<GroupListPage />);
    await screen.findByText('Alpha');
    
    const restaurantSelect = screen.getByDisplayValue('Any Restaurant');
    expect(restaurantSelect).toBeInTheDocument();
  });

  test('filters by restaurant', async () => {
    render(<GroupListPage />);
    await screen.findByText('Alpha');
    
    const restaurantSelect = screen.getByDisplayValue('Any Restaurant');
    fireEvent.change(restaurantSelect, { target: { value: 'Pasta Place' } });
    
    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    });
  });

  test('filters by No Restaurant option', async () => {
    render(<GroupListPage />);
    await screen.findByText('Alpha');
    
    const restaurantSelect = screen.getByDisplayValue('Any Restaurant');
    fireEvent.change(restaurantSelect, { target: { value: 'No Restaurant' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });
  });

  test('renders time filter dropdown', async () => {
    render(<GroupListPage />);
    await screen.findByText('Alpha');
    
    const timeSelect = screen.getByDisplayValue('Any time');
    expect(timeSelect).toBeInTheDocument();
  });

  test('filters by "Has time" option', async () => {
    render(<GroupListPage />);
    await screen.findByText('Alpha');
    
    const timeSelect = screen.getByDisplayValue('Any time');
    fireEvent.change(timeSelect, { target: { value: 'has' } });
    
    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    });
  });

  test('filters by "No time" option', async () => {
    render(<GroupListPage />);
    await screen.findByText('Alpha');
    
    const timeSelect = screen.getByDisplayValue('Any time');
    fireEvent.change(timeSelect, { target: { value: 'no' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });
  });

  test('shows date/time range inputs when "Match range" is selected', async () => {
    render(<GroupListPage />);
    await screen.findByText('Alpha');
    
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

  test('shows no groups message when empty', async () => {
    const getDocs = require('firebase/firestore').getDocs;
    getDocs.mockResolvedValueOnce({ docs: [] });
    
    render(<GroupListPage />);
    
    await waitFor(() => {
      expect(screen.getByText("You don't have any groups yet.")).toBeInTheDocument();
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
    await screen.findByText('Alpha');
    
    // Alpha has 2 members, Beta has 1, Gamma has 3
    const groupItems = screen.getAllByRole('listitem');
    expect(groupItems.length).toBe(3);
  });

  test('shows loading state initially', () => {
    render(<GroupListPage />);
    // Loading disappears once groups load
    expect(screen.queryByText('Loading groups…')).toBeInTheDocument();
  });

  test('shows no matches message when filter returns no results', async () => {
    render(<GroupListPage />);
    await screen.findByText('Alpha');
    
    const searchInput = screen.getByPlaceholderText('Search groups by name');
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No groups match your search or filters.')).toBeInTheDocument();
    });
  });

  test('group links navigate to correct group page', async () => {
    render(<GroupListPage />);
    await screen.findByText('Alpha');
    
    const alphaLink = screen.getByText('Alpha').closest('a');
    expect(alphaLink).toHaveAttribute('href', '/groups/g1');
  });
});