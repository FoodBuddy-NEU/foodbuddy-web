'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebaseClient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { createUserProfile } from '@/lib/userProfile';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // WHY: Create Firebase authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // WHY: Initialize user profile in Firestore with default values
      await createUserProfile(
        userCredential.user.uid,
        email,
        username || email.split('@')[0] // Use email prefix if no username provided
      );

      router.push('/profile'); // Redirect to profile page to complete setup
    } catch (err: unknown) {
      const message = err instanceof FirebaseError ? err.message : 'Sign up failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold mb-4">Sign up</h1>
      <form onSubmit={onSignup} className="space-y-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <button
          disabled={loading}
          className="w-full border rounded p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Create account'}
        </button>
      </form>
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      <div className="mt-3 text-sm dark:text-gray-300">
        Have an account?{' '}
        <Link href="/login" className="underline text-blue-600 dark:text-blue-400">
          Log in
        </Link>
      </div>
    </div>
  );
}
