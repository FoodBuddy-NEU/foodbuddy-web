"use client";

import { useState } from "react";
import RestaurantCard from "@/components/RestaurantCard";
import { restaurants } from "@/data/restaurants";

export default function RestaurantsPage() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "price" | "discount" | "asc">("distance");

  // Visual-only: filtered list not applied yet per your request
  const results = restaurants;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Find restaurants</h1>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full rounded-2xl border px-4 py-3 text-sm bg-white dark:bg-neutral-900"
        />
      </div>

      <div className="mb-2">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="rounded-2xl border px-4 py-2 text-sm"
        >
          Show filters
        </button>
        {showFilters && (
          <div className="mt-3 rounded-2xl border p-3 text-sm text-neutral-600">
            Filters UI placeholder (cuisine, price, tags…)
          </div>
        )}
      </div>

      <div className="mt-6 mb-3 text-sm font-medium text-neutral-600">Sort</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: "distance", label: "Distance ↑" },
          { key: "price", label: "Price" },
          { key: "discount", label: "Discount" },
          { key: "asc", label: "Asc ↑" },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key as typeof sortBy)}
            className={`rounded-full px-4 py-2 text-sm border ${
              sortBy === opt.key ? "bg-black text-white dark:bg-white dark:text-black" : ""
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-2 text-sm text-neutral-600">
        Showing {results.length} results
      </div>

      <div className="flex flex-col gap-3">
        {results.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} />
        ))}
      </div>
    </div>
  );
}