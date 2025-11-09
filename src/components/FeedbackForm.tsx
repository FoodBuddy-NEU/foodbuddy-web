"use client";

import { useState, useEffect, useRef } from "react";
import type { Restaurant } from "@/types/restaurant";
import { useAuth } from "@/lib/AuthProvider";
import { useTheme } from "@/lib/ThemeProvider";

interface FeedbackFormProps {
  restaurant: (Restaurant & { id: string }) | { id: string; name: string };
  defaultFeedbackType?: "menu" | "contact-info";
  hideFeedbackTypeSelector?: boolean;
}

export default function FeedbackForm({ restaurant, defaultFeedbackType = "menu", hideFeedbackTypeSelector = false }: FeedbackFormProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  const [feedbackType, setFeedbackType] = useState<"menu" | "contact-info">(
    defaultFeedbackType
  );
  const [feedbackContent, setFeedbackContent] = useState("");
  const [userEmail, setUserEmail] = useState(user?.email || "");
  const [userName, setUserName] = useState(user?.displayName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Apply background color based on theme
  useEffect(() => {
    if (formContainerRef.current) {
      if (theme === "light") {
        formContainerRef.current.style.backgroundColor = "white";
        formContainerRef.current.style.borderColor = "black";
      } else {
        formContainerRef.current.style.backgroundColor = "#171717";
        formContainerRef.current.style.borderColor = "#404040";
      }
    }
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackContent.trim()) {
      setErrorMessage("Please enter feedback content");
      return;
    }

    if (!userEmail.trim()) {
      setErrorMessage("Please enter your email");
      return;
    }

    if (!userName.trim()) {
      setErrorMessage("Please enter your name");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          userEmail,
          userName,
          feedbackType,
          feedbackContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSubmitStatus("success");
      setFeedbackContent("");
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      ref={formContainerRef}
      className="mt-8 rounded-lg border-2 p-6"
      style={{
        backgroundColor: theme === "light" ? "white" : "#171717",
        borderColor: theme === "light" ? "black" : "#404040"
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: theme === "light" ? "black" : "#f5f5f5" }}>Share Your Feedback</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Feedback Type - Only show if not hidden */}
        {!hideFeedbackTypeSelector && (
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-neutral-300">
              Feedback Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-black dark:text-neutral-300">
                <input
                  type="radio"
                  value="menu"
                  checked={feedbackType === "menu"}
                  onChange={(e) =>
                    setFeedbackType(e.target.value as "menu" | "contact-info")
                  }
                />
                Menu
              </label>
              <label className="flex items-center gap-2 text-black dark:text-neutral-300">
                <input
                  type="radio"
                  value="contact-info"
                  checked={feedbackType === "contact-info"}
                  onChange={(e) =>
                    setFeedbackType(e.target.value as "menu" | "contact-info")
                  }
                />
                Contact Info
              </label>
            </div>
          </div>
        )}

        {/* User Name */}
        <div>
          <label htmlFor="userName" className="block text-sm font-medium mb-2 text-black dark:text-neutral-300">
            Your Name
          </label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2 border border-black dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
          />
        </div>

        {/* User Email */}
        <div>
          <label htmlFor="userEmail" className="block text-sm font-medium mb-2 text-black dark:text-neutral-300">
            Your Email
          </label>
          <input
            id="userEmail"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 border border-black dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
          />
        </div>

        {/* Feedback Content */}
        <div>
          <label
            htmlFor="feedbackContent"
            className="block text-sm font-medium mb-2 text-black dark:text-neutral-300"
          >
            Feedback Content
          </label>
          <textarea
            id="feedbackContent"
            value={feedbackContent}
            onChange={(e) => setFeedbackContent(e.target.value)}
            placeholder={`Share your feedback about ${feedbackType === "menu" ? "the menu" : "contact information"}...`}
            className="w-full px-4 py-2 border border-black dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 min-h-[120px]"
          />
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        {/* Success Message */}
        {submitStatus === "success" && (
          <div className="p-3 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-200 rounded-lg text-sm">
            ✓ Thank you! Your feedback has been submitted successfully.
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}
