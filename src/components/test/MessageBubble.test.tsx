import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/MessageBubble';

test('renders message text', () => {
  render(<MessageBubble message={{ id: 'm1', groupId: 'g1', senderId: 'u1', type: 'text', text: 'Hello', createdAt: null }} isMe={false} />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});

test('aligns to end when isMe', () => {
  render(<MessageBubble message={{ id: 'm2', groupId: 'g1', senderId: 'u1', type: 'text', text: 'Mine', createdAt: null }} isMe />);
  // DOM: outer div > inner div > content div > bubble div (contains text)
  // getByText returns the bubble div, so we need 3 parentElements to reach outer div
  const wrapper = screen.getByText('Mine').parentElement?.parentElement?.parentElement;
  expect(wrapper?.className).toContain('flex');
  expect(wrapper?.className).toContain('justify-end');
});

test('aligns to start when not me', () => {
  render(<MessageBubble message={{ id: 'm3', groupId: 'g1', senderId: 'u2', type: 'text', text: 'Yours', createdAt: null }} isMe={false} />);
  // DOM: outer div > inner div > content div > bubble div (contains text)
  const wrapper = screen.getByText('Yours').parentElement?.parentElement?.parentElement;
  expect(wrapper?.className).toContain('flex');
  expect(wrapper?.className).toContain('justify-start');
});