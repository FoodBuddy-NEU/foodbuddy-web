"use client";

import { useTheme } from "@/lib/ThemeProvider";
import { useContext } from "react";

// Safe wrapper that handles ThemeContext being undefined
function ThemeToggleContent() {
  try {
    const { theme, toggleTheme } = useTheme();

    return (
      <button
        onClick={toggleTheme}
        className="rounded-full border px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-900"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        title={`Current theme: ${theme}`}
      >
        {theme === "light" ? (
          <span>🌙 Dark</span>
        ) : (
          <span>☀️ Light</span>
        )}
      </button>
    );
  } catch {
    // If ThemeProvider is not available, render a placeholder
    return null;
  }
}

export default function ThemeToggle() {
  return <ThemeToggleContent />;
}
