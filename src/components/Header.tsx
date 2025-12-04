'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: logo/site name */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span>FoodBuddy</span>
        </Link>

        {/* Desktop Navigation - hidden on mobile */}
        <nav className="hidden sm:flex items-center gap-2 sm:gap-4">
          <Link href="/">Home</Link>
          <Link href="/bookmarks">Bookmarks</Link>
          <Link href="/groups">Group Chat</Link>
          <Link href="/profile">Profile</Link>
          <div className="relative z-10">
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile Navigation - hamburger menu */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="relative z-10">
            <ThemeToggle />
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t bg-white">
          <nav className="flex flex-col">
            <Link
              href="/"
              className="px-4 py-3 hover:bg-gray-100 border-b"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/bookmarks"
              className="px-4 py-3 hover:bg-gray-100 border-b"
              onClick={() => setMobileMenuOpen(false)}
            >
              Bookmarks
            </Link>
            <Link
              href="/groups"
              className="px-4 py-3 hover:bg-gray-100 border-b"
              onClick={() => setMobileMenuOpen(false)}
            >
              Group Chat
            </Link>
            <Link
              href="/profile"
              className="px-4 py-3 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profile
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

