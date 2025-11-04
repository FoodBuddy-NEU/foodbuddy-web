"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addBookmark, removeBookmark, subscribeBookmarks } from "@/lib/bookmarks";
import { useAuth } from "@/lib/AuthProvider"; // your existing auth context

interface Props {
  restaurantId: string;
  className?: string; // so you can match existing button styles
}

export default function BookmarkButton({ restaurantId, className }: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const isBookmarked = useMemo(() => bookmarkedIds.has(restaurantId), [bookmarkedIds, restaurantId]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeBookmarks(user.uid, setBookmarkedIds);
    return () => unsub();
  }, [user]);

  const onToggle = async () => {
    if (loading) return; // avoid flicker while auth state is resolving
    if (!user) {
      router.push("/login");
      return;
    }

    // Optimistic update
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(restaurantId)) next.delete(restaurantId);
      else next.add(restaurantId);
      return next;
    });

    try {
      if (isBookmarked) await removeBookmark(user.uid, restaurantId);
      else await addBookmark(user.uid, restaurantId);
      // onSnapshot will reconcile with server truth
    } catch (e) {
      // revert on error
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.add(restaurantId); else next.delete(restaurantId);
        return next;
      });
      console.error("Bookmark toggle failed", e);
      // Optionally show a toast if you already have one
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isBookmarked}
      className={className}
    >
      <span className="mr-1">{isBookmarked ? "★" : "☆"}</span>
      {isBookmarked ? "Saved" : "Bookmark"}
    </button>
  );
}