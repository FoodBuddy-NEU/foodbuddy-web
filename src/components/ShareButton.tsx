'use client';

import { useState } from 'react';

interface ShareButtonProps {
  restaurantId: string;
  restaurantName: string;
}

export default function ShareButton({ restaurantId, restaurantName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/restaurants/${restaurantId}`;

    // Try Web Share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurantName,
          text: `Check out ${restaurantName} on FoodBuddy!`,
          url: url,
        });
        return;
      } catch (err) {
        // User cancelled the share dialog, continue to clipboard fallback
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
      title="Share this restaurant"
    >
      <span>{copied ? '✓ Copied!' : '🔗 Share'}</span>
    </button>
  );
}
