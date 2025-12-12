import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { ChatInput } from '@/app/groups/chatInput';

jest.mock('@/lib/chat', () => {
  const sendTextMessage = jest.fn(async () => {});
  return { sendTextMessage };
});
import { sendTextMessage } from '@/lib/chat';

beforeEach(() => { jest.clearAllMocks(); });

test('sends message on button click and clears input', async () => {
  render(<ChatInput groupId="g1" currentUserId="u1" />);
  const input = screen.getByPlaceholderText('Please write your message...');
  fireEvent.change(input, { target: { value: ' hello ' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
  });
  expect(sendTextMessage).toHaveBeenCalledWith({ groupId: 'g1', senderId: 'u1', text: ' hello ' });
});

test('sends message on Enter', async () => {
  render(<ChatInput groupId="g1" currentUserId="u1" />);
  const input = screen.getByPlaceholderText('Please write your message...');
  fireEvent.change(input, { target: { value: 'hi' } });
  await act(async () => {
    fireEvent.keyDown(input, { key: 'Enter' });
  });
  expect(sendTextMessage).toHaveBeenCalledWith({ groupId: 'g1', senderId: 'u1', text: 'hi' });
});

test('does not send empty message', () => {
  render(<ChatInput groupId="g1" currentUserId="u1" />);
  const input = screen.getByPlaceholderText('Please write your message...');
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(sendTextMessage).not.toHaveBeenCalled();
});