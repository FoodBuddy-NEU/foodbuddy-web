import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { addGroupMember } from '@/lib/chat';
import type { ChatMessage } from '@/types/chatType';
import GroupChatPage from '@/app/groups/[groupId]/page';
import { ThemeProvider } from '@/lib/ThemeProvider';

jest.mock('next/navigation', () => {
  const push = jest.fn();
  const replace = jest.fn();
  return {
    useParams: () => ({ groupId: 'g1' }),
    useRouter: () => ({ replace, push }),
    __esModule: true,
    push,
    replace,
  };
});
jest.mock('@/lib/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/chat', () => {
  const subscribeGroupMessages = jest.fn((groupId: string, cb: (msgs: ChatMessage[]) => void) => {
    cb([
      { id: 'm1', groupId, senderId: 'u1', type: 'text', text: 'Hello', createdAt: null },
      { id: 'm2', groupId, senderId: 'u2', type: 'text', text: 'Hi', createdAt: null },
    ]);
    return () => {};
  });
  const groupMeta: { name?: string; ownerId?: string; memberIds?: string[]; diningTime?: string; restaurantId?: string; restaurantName?: string } = { name: 'g1', ownerId: 'u1', memberIds: ['u1'] };
  const subscribeGroupMeta = jest.fn((_groupId: string, cb: (d: { name?: string; ownerId?: string; memberIds?: string[] }) => void) => {
    cb({ ...groupMeta });
    return () => {};
  });
  const __setGroupMeta = (next: Partial<typeof groupMeta>) => {
    Object.assign(groupMeta, next);
  };
  const addGroupMember = jest.fn();
  const removeGroupMember = jest.fn(async () => {});
  const disbandGroup = jest.fn(async () => {});
  const updateGroupDiningTime = jest.fn(async () => {});
  const updateGroupRestaurant = jest.fn(async () => {});
  return { subscribeGroupMessages, subscribeGroupMeta, addGroupMember, removeGroupMember, disbandGroup, updateGroupDiningTime, updateGroupRestaurant, __setGroupMeta };
});
jest.mock('../../../components/MessageBubble', () => ({ MessageBubble: ({ message }: { message: ChatMessage }) => <div>{message.text}</div> }));
jest.mock('@/app/groups/chatInput', () => ({ ChatInput: () => <div data-testid="chat-input" /> }));
jest.mock('@/lib/userProfile', () => ({
  getUserProfile: jest.fn(async () => null),
  searchUsersByUsername: jest.fn(async () => [{ userId: 'u2', username: 'User2', avatarUrl: '/img2' }]),
}));

const { useAuth } = jest.requireMock('@/lib/AuthProvider') as { useAuth: jest.Mock };
type GroupMeta = { name?: string; ownerId?: string; memberIds?: string[]; diningTime?: string; restaurantId?: string; restaurantName?: string };
const chatMock = jest.requireMock('@/lib/chat') as {
  __setGroupMeta: (next: Partial<GroupMeta>) => void;
  removeGroupMember: jest.Mock;
  disbandGroup: jest.Mock;
  updateGroupDiningTime: jest.Mock;
  updateGroupRestaurant: jest.Mock;
};
const { __setGroupMeta, removeGroupMember, disbandGroup, updateGroupDiningTime, updateGroupRestaurant } = chatMock;
const navMock = jest.requireMock('next/navigation') as { push: jest.Mock; replace: jest.Mock };
const { push } = navMock;

beforeEach(() => {
  useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
});

test('renders header, back link, messages, and input', () => {
  render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  expect(screen.getByText(/Group chat – g1/)).toBeInTheDocument();
  const backLink = screen.getByText('← Back');
  expect(backLink).toHaveAttribute('href', '/groups');
  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(screen.getByText('Hi')).toBeInTheDocument();
  expect(screen.getByTestId('chat-input')).toBeInTheDocument();
});

test('manage members toggles, searches, and adds member successfully', async () => {
  render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  const toggle = screen.getByText('Manage');
  fireEvent.click(toggle);
  expect(screen.getByText('Close')).toBeInTheDocument();
  expect(screen.getByText('Type at least 2 characters to search')).toBeInTheDocument();

  const input = screen.getByPlaceholderText('Search usernames…') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'us' } });
  expect(input.value).toBe('us');

  expect(await screen.findByText('User2')).toBeInTheDocument();
  const addBtn = screen.getByText('Add');
  fireEvent.click(addBtn);

  expect(addGroupMember).toHaveBeenCalledWith('g1', 'u2');

  expect(await screen.findByText('Type at least 2 characters to search')).toBeInTheDocument();
});

test('add member failure shows alert and keeps search text', async () => {
  (addGroupMember as jest.Mock).mockRejectedValueOnce(new Error('failed'));
  const origAlert = window.alert;
  window.alert = jest.fn();
  useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
  __setGroupMeta({ ownerId: 'u1', memberIds: ['u1'] });

  render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  fireEvent.click(screen.getByText('Manage'));
  const input = screen.getByPlaceholderText('Search usernames…') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'us' } });
  expect(await screen.findByText('User2')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Add'));

  await waitFor(() => expect(window.alert).toHaveBeenCalled());
  expect(input.value).toBe('us');
  window.alert = origAlert;
});

test('shows members section and exit button for regular member; clicking exits', async () => {
  useAuth.mockReturnValue({ user: { uid: 'u2' }, loading: false });
  __setGroupMeta({ ownerId: 'u1', memberIds: ['u1', 'u2'] });
  removeGroupMember.mockReset();
  push.mockReset();

  render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  fireEvent.click(screen.getByText('Manage'));
  expect(screen.getByText('Group Members')).toBeInTheDocument();
  const btn = screen.getByText('Exit Group');
  fireEvent.click(btn);
  await waitFor(() => {
    expect(removeGroupMember).toHaveBeenCalledWith('g1', 'u2');
    expect(push).toHaveBeenCalledWith('/groups');
  });
});

test('shows disband button for owner; clicking confirms and disbands', async () => {
  useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
  __setGroupMeta({ ownerId: 'u1', memberIds: ['u1'] });
  disbandGroup.mockReset();
  push.mockReset();
  const origConfirm = window.confirm;
  window.confirm = jest.fn(() => true);

  render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  fireEvent.click(screen.getByText('Manage'));
  const btn = screen.getByText('Disband Group');
  fireEvent.click(btn);
  await waitFor(() => {
    expect(disbandGroup).toHaveBeenCalledWith('g1');
    expect(push).toHaveBeenCalledWith('/groups');
  });
  window.confirm = origConfirm;
});

test('dining settings view-only for non-owner', () => {
  useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
  __setGroupMeta({ ownerId: 'u2', diningTime: '2025-01-01T07:30:00.000Z', restaurantId: 'r1', restaurantName: 'R1' });
  const { container } = render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  fireEvent.click(screen.getByText(/Dining/));
  expect(container.querySelector('.ds-readonly')).toBeInTheDocument();
});

test('owner sets date saves default time', async () => {
  useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
  __setGroupMeta({ ownerId: 'u1' });
  const { container } = render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  fireEvent.click(screen.getByText(/Dining/));
  const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
  const today = new Date().toISOString().split('T')[0];
  fireEvent.change(dateInput, { target: { value: today } });
  await waitFor(() => {
    expect(updateGroupDiningTime).toHaveBeenCalled();
  });
});

test('owner sets time after date', async () => {
  useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
  __setGroupMeta({ ownerId: 'u1' });
  const { container } = render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  fireEvent.click(screen.getByText(/Dining/));
  const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
  const timeSelect = container.querySelector('.ds-select') as HTMLSelectElement;
  const today = new Date().toISOString().split('T')[0];
  fireEvent.change(dateInput, { target: { value: today } });
  fireEvent.change(timeSelect, { target: { value: '07:30' } });
  await waitFor(() => {
    expect(updateGroupDiningTime).toHaveBeenCalled();
  });
});

test('clear dining time resets', async () => {
  useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
  __setGroupMeta({ ownerId: 'u1' });
  const { container } = render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  fireEvent.click(screen.getByText(/Dining/));
  const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
  const today = new Date().toISOString().split('T')[0];
  fireEvent.change(dateInput, { target: { value: today } });
  const clearBtn = screen.getByText('Clear');
  fireEvent.click(clearBtn);
  await waitFor(() => {
    expect(updateGroupDiningTime).toHaveBeenCalledWith('g1', '');
  });
});

test('remove restaurant clears selection', async () => {
  useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
  __setGroupMeta({ ownerId: 'u1', restaurantName: 'R1', restaurantId: 'r1' });
  render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  fireEvent.click(screen.getByText(/Dining/));
  fireEvent.click(screen.getByText('Remove'));
  await waitFor(() => {
    expect(updateGroupRestaurant).toHaveBeenCalledWith('g1', '', '');
  });
});

test('restaurant search hints and no results', async () => {
  useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
  __setGroupMeta({ ownerId: 'u1' });
  render(<ThemeProvider><GroupChatPage /></ThemeProvider>);
  fireEvent.click(screen.getByText(/Dining/));
  const input = screen.getByPlaceholderText(/Search restaurants/i);
  fireEvent.change(input, { target: { value: 'a' } });
  expect(screen.getByText(/Type at least 2 characters to search/i)).toBeInTheDocument();
  fireEvent.change(input, { target: { value: 'zzzz' } });
  expect(await screen.findByText(/No restaurants found/i)).toBeInTheDocument();
});