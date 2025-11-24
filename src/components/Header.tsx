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
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="hidden sm:inline">
            Home
          </Link>
          <Link href="/bookmarks" className="text-sm sm:text-base">
            Bookmarks
          </Link>
          <Link href="/groups" className="hidden md:inline">
            Group Chat
          </Link>
          <Link href="/profile" className="text-sm sm:text-base">
            Profile
          </Link>

          {/* Theme toggle button - ensure it's always clickable */}
          <div className="relative z-10">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
