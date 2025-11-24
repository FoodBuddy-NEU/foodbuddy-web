import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { addGroupMember } from '@/lib/chat';
import type { ChatMessage } from '@/types/chatType';
import GroupChatPage from '@/app/groups/[groupId]/page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ groupId: 'g1' }),
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('@/lib/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'u1' }, loading: false }) }));
jest.mock('@/lib/chat', () => {
  const subscribeGroupMessages = (groupId: string, cb: (msgs: ChatMessage[]) => void) => {
    cb([
      { id: 'm1', groupId, senderId: 'u1', type: 'text', text: 'Hello', createdAt: null },
      { id: 'm2', groupId, senderId: 'u2', type: 'text', text: 'Hi', createdAt: null },
    ]);
    return () => {};
  };
  const subscribeGroupMeta = (_groupId: string, cb: (d: { name?: string; ownerId?: string; memberIds?: string[] }) => void) => {
    cb({ name: 'g1', ownerId: 'u1', memberIds: ['u1'] });
    return () => {};
  };
  const addGroupMember = jest.fn();
  return { subscribeGroupMessages, subscribeGroupMeta, addGroupMember };
});
jest.mock('../../../components/MessageBubble', () => ({ MessageBubble: ({ message }: { message: ChatMessage }) => <div>{message.text}</div> }));
jest.mock('@/app/groups/chatInput', () => ({ ChatInput: () => <div data-testid="chat-input" /> }));
jest.mock('@/lib/userProfile', () => ({
  getUserProfile: jest.fn(async () => null),
  searchUsersByUsername: jest.fn(async () => [{ userId: 'u2', username: 'User2', avatarUrl: '/img2' }]),
}));

test('renders header, back link, messages, and input', () => {
  render(<GroupChatPage />);
  expect(screen.getByText(/Group chat – g1/)).toBeInTheDocument();
  const backLink = screen.getByText('← Back');
  expect(backLink).toHaveAttribute('href', '/groups');
  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(screen.getByText('Hi')).toBeInTheDocument();
  expect(screen.getByTestId('chat-input')).toBeInTheDocument();
});

test('manage members toggles, searches, and adds member successfully', async () => {
  render(<GroupChatPage />);
  const toggle = screen.getByText('Manage members');
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

  render(<GroupChatPage />);
  fireEvent.click(screen.getByText('Manage members'));
  const input = screen.getByPlaceholderText('Search usernames…') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'us' } });
  expect(await screen.findByText('User2')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Add'));

  await waitFor(() => expect(window.alert).toHaveBeenCalled());
  expect(input.value).toBe('us');
  window.alert = origAlert;
});