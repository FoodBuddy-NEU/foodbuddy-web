// app/groups/[groupId]/ChatInput.tsx
'use client';

import { useState } from 'react';
import { sendTextMessage } from '@/lib/chat';

interface ChatInputProps {
  groupId: string;
  currentUserId: string;
}

export function ChatInput({ groupId, currentUserId }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendTextMessage({
      groupId,
      senderId: currentUserId,
      text,
    });
    setText('');
  };

  return (
    <div className="border-t p-3 bg-background">
      <div className="flex gap-2">
        <input
          className="chat-input flex-1 border rounded-full px-3 py-2 text-sm"
          placeholder="Please write your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          className="chat-send-btn px-4 py-2 rounded-full border text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}