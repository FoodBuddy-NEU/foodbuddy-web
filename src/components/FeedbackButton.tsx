"use client";

import { useState } from "react";
import FeedbackForm from "./FeedbackForm";
import { useTheme } from "@/lib/ThemeProvider";

interface FeedbackButtonProps {
  restaurant: {
    id: string;
    name: string;
  };
  type: "contact" | "menu";
}

export default function FeedbackButton({ restaurant, type }: FeedbackButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const { theme } = useTheme();

  const label = type === "contact" ? "not working? Please tell us!" : "Incorrect? Please tell us!";
  const feedbackType = type === "contact" ? "contact-info" : "menu";

  if (showForm) {
    return (
      <div className="mt-4 rounded-lg border-l-4 p-4" style={{
        backgroundColor: theme === "light" ? "#f0f4f8" : "#1e3a8a",
        borderLeftColor: theme === "light" ? "#2563eb" : "#3b82f6",
        borderTopColor: theme === "light" ? "#e5e7eb" : "#1e3a8a",
        borderRightColor: theme === "light" ? "#e5e7eb" : "#1e3a8a",
        borderBottomColor: theme === "light" ? "#e5e7eb" : "#1e3a8a"
      }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold" style={{ color: theme === "light" ? "black" : "#dbeafe" }}>Send Feedback</h4>
          <button
            onClick={() => setShowForm(false)}
            className="text-sm hover:underline"
            style={{ color: theme === "light" ? "#2563eb" : "#93c5fd" }}
          >
            Hide
          </button>
        </div>
        <FeedbackForm restaurant={restaurant} defaultFeedbackType={feedbackType} hideFeedbackTypeSelector />
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="ml-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
    >
      {label}
    </button>
  );
}
