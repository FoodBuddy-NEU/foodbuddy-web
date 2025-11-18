'use client';

import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: your logo/site name */}
        <Link href="/" className="font-semibold">
          FoodBuddy
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <Link href="/">Home</Link>
          <Link href="/bookmarks">Bookmarks</Link>
          <Link href="/groups">Group Chat</Link>

          {/* Theme toggle button */}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
