"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import RestaurantCard from "@/components/RestaurantCard";
import data from "@/data/restaurants.json";

type Restaurant = typeof data[number];

function normalize(str: string) {
  return str.toLowerCase().trim();
}

function priceBucket(p?: string) {
  if (!p) return Number.POSITIVE_INFINITY;
  return p.length; // "$" -> 1, "$$$" -> 3
}

function extractBestDiscountPercent(r: Restaurant) {
  const texts: string[] = [];
  r.deals?.forEach((d) => {
    // Some deals don't have `description`, so narrow dynamically
    const deal = d as any;
    if (deal.title) texts.push(String(deal.title));
    if (typeof deal.description === "string") texts.push(deal.description);
  });
  const re = /(\d{1,2})(?=\s*%)/g;
  let max = 0;
  for (const t of texts) {
    let m: RegExpExecArray | null;
    const g = new RegExp(re);
    while ((m = g.exec(t))) {
      max = Math.max(max, Number(m[1]));
    }
  }
  return max; // 0 if none
}

export default function RestaurantsPage() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFoodTypes, setActiveFoodTypes] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"distance" | "price" | "discount" | "name">("distance");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // derive facets from data
  const allFoodTypes = useMemo(
    () => Array.from(new Set(data.flatMap((r) => r.foodTypes ?? []))).sort(),
    []
  );
  const allTags = useMemo(
    () => Array.from(new Set(data.flatMap((r) => r.tags ?? []))).sort(),
    []
  );

  const results = useMemo(() => {
    const name = normalize(search);

    // 1) filter by name + facets
    let list = data.filter((r) => {
      const nameOk = name ? normalize(r.name).includes(name) : true;

      const foodOk =
        activeFoodTypes.length === 0 ||
        (r.foodTypes ?? []).some((t) => activeFoodTypes.includes(t));

      const tagOk =
        activeTags.length === 0 || (r.tags ?? []).some((t) => activeTags.includes(t));

      return nameOk && foodOk && tagOk;
    });

    // 2) sort
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortBy) {
        case "price":
          return (priceBucket(a.priceRange) - priceBucket(b.priceRange)) * dir;
        case "discount":
          return (extractBestDiscountPercent(a) - extractBestDiscountPercent(b)) * dir;
        case "name":
          return normalize(a.name).localeCompare(normalize(b.name)) * dir;
        case "distance":
        default:
          // when distance missing, keep original order using index as tiebreaker
          const da = (a as any).distance ?? Number.POSITIVE_INFINITY;
          const db = (b as any).distance ?? Number.POSITIVE_INFINITY;
          return (da - db) * dir;
      }
    });

    return list;
  }, [search, activeFoodTypes, activeTags, sortBy, sortDir]);

  function handleSortClick(key: typeof sortBy) {
    if (key === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Logo and heading */}
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/logo.png"
          alt="FoodBuddy Logo"
          width={120}
          height={120}
          priority
          className="mb-4"
        />
        <p className="text-lg font-semibold text-center">Find restaurants near NEU-Oak</p>
      </div>

      <h1 className="text-2xl font-bold mb-4">Find restaurants</h1>

      <div className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full rounded-2xl border px-4 py-3 text-sm bg-white dark:bg-neutral-900"
          aria-label="Search by name"
        />
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="rounded-2xl border px-4 py-2 text-sm"
          aria-expanded={showFilters}
          aria-controls="filters"
        >
          {showFilters ? "Hide filters" : "Show filters"}
        </button>
      </div>

      {showFilters && (
        <div id="filters" className="mt-3 rounded-2xl border p-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="font-medium mb-2">Food types</div>
              <div className="flex flex-wrap gap-2">
                {allFoodTypes.map((t) => {
                  const on = activeFoodTypes.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() =>
                        setActiveFoodTypes((prev) =>
                          on ? prev.filter((x) => x !== t) : [...prev, t]
                        )
                      }
                      className={`rounded-full border px-3 py-1 ${on ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((t) => {
                  const on = activeTags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() =>
                        setActiveTags((prev) =>
                          on ? prev.filter((x) => x !== t) : [...prev, t]
                        )
                      }
                      className={`rounded-full border px-3 py-1 ${on ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 mb-2 text-sm font-medium text-neutral-600">Sort</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: "distance", label: `Distance ${sortBy === "distance" ? (sortDir === "asc" ? "↑" : "↓") : ""}` },
          { key: "price", label: `Price ${sortBy === "price" ? (sortDir === "asc" ? "↑" : "↓") : ""}` },
          { key: "discount", label: `Discount ${sortBy === "discount" ? (sortDir === "asc" ? "↑" : "↓") : ""}` },
          { key: "name", label: `Name ${sortBy === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}` },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleSortClick(opt.key as typeof sortBy)}
            className={`rounded-full px-4 py-2 text-sm border ${
              sortBy === opt.key ? "bg-black text-white dark:bg-white dark:text-black" : ""
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-2 text-sm text-neutral-600">Showing {results.length} results</div>

      <div className="flex flex-col gap-3">
        {results.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} />
        ))}
      </div>
    </div>
  );
}
