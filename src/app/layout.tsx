import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/AuthProvider";

export const metadata: Metadata = {
  title: "FoodBuddy",
  description: "Find restaurants, deals, and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* Keep your existing header/nav wrapper and classes */}
          <header className="border-b">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
              {/* Left: your logo/site name */}
              <Link href="/" className="font-semibold">FoodBuddy</Link>

              {/* Existing nav: keep your links; just add the Bookmarks tab */}
              <nav className="flex items-center gap-4">
                {/* Example existing links */}
                <Link href="/">Home</Link>

                {/* NEW: Bookmarks tab (single addition) */}
                <Link href="/bookmarks">Bookmarks</Link>
              </nav>
            </div>
          </header>

          {/* Page content */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}