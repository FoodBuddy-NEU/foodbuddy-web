"use client";

import { useTheme } from "@/lib/ThemeProvider";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <button
        className="rounded-full border px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-900"
        disabled
        aria-label="Loading theme"
      >
        <span>☀️</span>
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
