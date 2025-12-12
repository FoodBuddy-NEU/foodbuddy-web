import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FriendsPage from './page';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

// Mock AuthProvider
jest.mock('@/lib/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock friends library
jest.mock('@/lib/friends', () => ({
  subscribeIncomingFriendRequests: jest.fn((userId, cb) => {
    cb([]);
    return () => {};
  }),
  subscribeFriendsList: jest.fn((userId, cb) => {
    cb([]);
    return () => {};
  }),
  sendFriendRequest: jest.fn(),
  acceptFriendRequest: jest.fn(),
  rejectFriendRequest: jest.fn(),
  removeFriend: jest.fn(),
  checkFriendshipStatus: jest.fn(),
}));

// Mock userProfile
jest.mock('@/lib/userProfile', () => ({
  searchUsersByUsername: jest.fn(),
  getUserProfile: jest.fn(),
}));

// Mock UserProfileModal
jest.mock('@/components/UserProfileModal', () => ({
  __esModule: true,
  default: () => <div data-testid="profile-modal">Profile Modal</div>,
}));

const { useAuth } = jest.requireMock('@/lib/AuthProvider') as { useAuth: jest.Mock };
const { 
  subscribeIncomingFriendRequests, 
  subscribeFriendsList, 
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  checkFriendshipStatus 
} = jest.requireMock('@/lib/friends');
const { searchUsersByUsername, getUserProfile } = jest.requireMock('@/lib/userProfile');

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: { uid: 'user1' }, loading: false });
  subscribeIncomingFriendRequests.mockImplementation((userId: string, cb: (reqs: unknown[]) => void) => {
    cb([]);
    return () => {};
  });
  subscribeFriendsList.mockImplementation((userId: string, cb: (friends: string[]) => void) => {
    cb([]);
    return () => {};
  });
});

describe('FriendsPage', () => {
  test('redirects to login when not authenticated', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    render(<FriendsPage />);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  test('shows loading state while authenticating', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    render(<FriendsPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders friends page with tabs when authenticated', () => {
    render(<FriendsPage />);
    expect(screen.getByText('Friends')).toBeInTheDocument();
    expect(screen.getByText(/My Friends/)).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
    expect(screen.getByText('Add Friend')).toBeInTheDocument();
  });

  test('shows empty friends message when no friends', () => {
    render(<FriendsPage />);
    expect(screen.getByText("You don't have any friends yet.")).toBeInTheDocument();
  });

  test('switches to requests tab', () => {
    render(<FriendsPage />);
    fireEvent.click(screen.getByText('Requests'));
    expect(screen.getByText('No pending friend requests.')).toBeInTheDocument();
  });

  test('switches to add friend tab and shows search input', () => {
    render(<FriendsPage />);
    fireEvent.click(screen.getByText('Add Friend'));
    expect(screen.getByPlaceholderText('Search by username...')).toBeInTheDocument();
  });

  test('shows friends list when user has friends', async () => {
    subscribeFriendsList.mockImplementation((userId: string, cb: (friends: string[]) => void) => {
      cb(['friend1']);
      return () => {};
    });
    getUserProfile.mockResolvedValue({ username: 'FriendUser', avatarUrl: '/avatar.jpg' });

    render(<FriendsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('FriendUser')).toBeInTheDocument();
    });
  });

  test('shows friend requests with accept/decline buttons', async () => {
    subscribeIncomingFriendRequests.mockImplementation((userId: string, cb: (reqs: unknown[]) => void) => {
      cb([{ id: 'req1', fromUserId: 'user2', toUserId: 'user1', status: 'pending', createdAt: new Date() }]);
      return () => {};
    });
    getUserProfile.mockResolvedValue({ username: 'RequesterUser', avatarUrl: '/avatar.jpg' });

    render(<FriendsPage />);
    fireEvent.click(screen.getByText('Requests'));

    await waitFor(() => {
      expect(screen.getByText('RequesterUser')).toBeInTheDocument();
      expect(screen.getByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });
  });

  test('accepts friend request', async () => {
    subscribeIncomingFriendRequests.mockImplementation((userId: string, cb: (reqs: unknown[]) => void) => {
      cb([{ id: 'req1', fromUserId: 'user2', toUserId: 'user1', status: 'pending', createdAt: new Date() }]);
      return () => {};
    });
    getUserProfile.mockResolvedValue({ username: 'RequesterUser' });
    acceptFriendRequest.mockResolvedValue(undefined);

    render(<FriendsPage />);
    fireEvent.click(screen.getByText('Requests'));

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(acceptFriendRequest).toHaveBeenCalledWith('req1', 'user2', 'user1');
    });
  });

  test('rejects friend request', async () => {
    subscribeIncomingFriendRequests.mockImplementation((userId: string, cb: (reqs: unknown[]) => void) => {
      cb([{ id: 'req1', fromUserId: 'user2', toUserId: 'user1', status: 'pending', createdAt: new Date() }]);
      return () => {};
    });
    getUserProfile.mockResolvedValue({ username: 'RequesterUser' });
    rejectFriendRequest.mockResolvedValue(undefined);

    render(<FriendsPage />);
    fireEvent.click(screen.getByText('Requests'));

    await waitFor(() => {
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Decline'));

    await waitFor(() => {
      expect(rejectFriendRequest).toHaveBeenCalledWith('req1');
    });
  });

  test('searches for users and shows results', async () => {
    searchUsersByUsername.mockResolvedValue([
      { userId: 'user3', username: 'SearchResult', avatarUrl: '/avatar.jpg' }
    ]);
    checkFriendshipStatus.mockResolvedValue('none');

    render(<FriendsPage />);
    fireEvent.click(screen.getByText('Add Friend'));

    const input = screen.getByPlaceholderText('Search by username...');
    fireEvent.change(input, { target: { value: 'search' } });

    await waitFor(() => {
      expect(searchUsersByUsername).toHaveBeenCalledWith('search', 10);
    });

    await waitFor(() => {
      expect(screen.getByText('SearchResult')).toBeInTheDocument();
      // There are two 'Add Friend' buttons - tab and action button
      const addButtons = screen.getAllByRole('button', { name: 'Add Friend' });
      expect(addButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('sends friend request', async () => {
    searchUsersByUsername.mockResolvedValue([
      { userId: 'user3', username: 'SearchResult' }
    ]);
    checkFriendshipStatus.mockResolvedValue('none');
    sendFriendRequest.mockResolvedValue('req-id');

    render(<FriendsPage />);
    fireEvent.click(screen.getByText('Add Friend'));

    const input = screen.getByPlaceholderText('Search by username...');
    fireEvent.change(input, { target: { value: 'search' } });

    await waitFor(() => {
      expect(screen.getByText('SearchResult')).toBeInTheDocument();
    });

    // Find the action button (second 'Add Friend' button, not the tab)
    const addButtons = screen.getAllByRole('button', { name: 'Add Friend' });
    // The last one is the action button in the search results
    fireEvent.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(sendFriendRequest).toHaveBeenCalledWith('user1', 'user3');
    });
  });

  test('removes friend with confirmation', async () => {
    subscribeFriendsList.mockImplementation((userId: string, cb: (friends: string[]) => void) => {
      cb(['friend1']);
      return () => {};
    });
    getUserProfile.mockResolvedValue({ username: 'FriendUser' });
    removeFriend.mockResolvedValue(undefined);
    window.confirm = jest.fn(() => true);

    render(<FriendsPage />);

    await waitFor(() => {
      expect(screen.getByText('FriendUser')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Remove'));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(removeFriend).toHaveBeenCalledWith('user1', 'friend1');
    });
  });

  test('shows already friends status in search', async () => {
    searchUsersByUsername.mockResolvedValue([
      { userId: 'user3', username: 'AlreadyFriend' }
    ]);
    checkFriendshipStatus.mockResolvedValue('friends');

    render(<FriendsPage />);
    fireEvent.click(screen.getByText('Add Friend'));

    const input = screen.getByPlaceholderText('Search by username...');
    fireEvent.change(input, { target: { value: 'al' } });

    await waitFor(() => {
      expect(screen.getByText('AlreadyFriend')).toBeInTheDocument();
      expect(screen.getByText('✓ Friends')).toBeInTheDocument();
    });
  });

  test('shows request sent status in search', async () => {
    searchUsersByUsername.mockResolvedValue([
      { userId: 'user3', username: 'PendingUser' }
    ]);
    checkFriendshipStatus.mockResolvedValue('pending_sent');

    render(<FriendsPage />);
    fireEvent.click(screen.getByText('Add Friend'));

    const input = screen.getByPlaceholderText('Search by username...');
    fireEvent.change(input, { target: { value: 'pe' } });

    await waitFor(() => {
      expect(screen.getByText('PendingUser')).toBeInTheDocument();
      expect(screen.getByText('Request Sent')).toBeInTheDocument();
    });
  });
});
