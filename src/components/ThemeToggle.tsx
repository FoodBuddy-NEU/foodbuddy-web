"use client";

import { useTheme } from "@/lib/ThemeProvider";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering dynamic content until mounted
  if (!mounted) {
    return (
      <button
        disabled
        className="rounded-full border px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-900"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <span>⚙️</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full border px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-900"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      title={`Current theme: ${theme}`}
    >
      {theme === "light" ? (
        <span>☀️ Light</span>
      ) : (
        <span>🌙 Dark</span>
      )}
    </button>
  );
}
