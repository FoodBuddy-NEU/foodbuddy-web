"use client";

import { useTheme } from "@/lib/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

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
