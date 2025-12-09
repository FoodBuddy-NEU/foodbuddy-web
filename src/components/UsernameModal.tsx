'use client';

import { useState } from 'react';
import { updateUserProfile } from '@/lib/userProfile';

interface UsernameModalProps {
  userId: string;
  onComplete: (username: string) => void;
}

export default function UsernameModal({ userId, onComplete }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setError('Username is required');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (trimmedUsername.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }

    // Only allow alphanumeric, underscore, and dot
    if (!/^[a-zA-Z0-9_.]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, underscore, and dot');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateUserProfile(userId, { username: trimmedUsername });
      onComplete(trimmedUsername);
    } catch (err) {
      console.error('Error saving username:', err);
      setError('Failed to save username. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Welcome to FoodBuddy! 🍔
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Please set your username to continue. This will be your display name on the platform.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              3-20 characters, letters, numbers, underscore, and dot only
            </p>
          </div>
          
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
