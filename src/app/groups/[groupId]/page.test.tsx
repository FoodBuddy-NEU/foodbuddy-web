import { render, screen } from '@testing-library/react';
import type { ChatMessage } from '@/types/chatType';
import GroupChatPage from '@/app/groups/[groupId]/page';

jest.mock('next/navigation', () => ({ useParams: () => ({ groupId: 'g1' }) }));
jest.mock('@/lib/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'u1' }, loading: false }) }));
jest.mock('@/lib/chat', () => {
  const subscribeGroupMessages = (groupId: string, cb: (msgs: ChatMessage[]) => void) => {
    cb([
      { id: 'm1', groupId, senderId: 'u1', type: 'text', text: 'Hello', createdAt: null },
      { id: 'm2', groupId, senderId: 'u2', type: 'text', text: 'Hi', createdAt: null },
    ]);
    return () => {};
  };
  return { subscribeGroupMessages };
});
jest.mock('@/components/MessageBubble', () => ({ MessageBubble: ({ message }: { message: ChatMessage }) => <div>{message.text}</div> }));
jest.mock('@/app/groups/chatInput', () => ({ ChatInput: () => <div data-testid="chat-input" /> }));

test('renders header, back link, messages, and input', () => {
  render(<GroupChatPage />);
  expect(screen.getByText(/Group chat – g1/)).toBeInTheDocument();
  const backLink = screen.getByText('← Back');
  expect(backLink).toHaveAttribute('href', '/groups');
  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(screen.getByText('Hi')).toBeInTheDocument();
  expect(screen.getByTestId('chat-input')).toBeInTheDocument();
});