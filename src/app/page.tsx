'use client';

import { useMemo, useState, useEffect } from 'react';
import RestaurantCard from '@/components/RestaurantCard';
import data from '@/data/restaurants.json';
import type { Restaurant } from '@/types/restaurant';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthProvider';
import { auth } from '@/lib/firebaseClient';
import { signOut } from 'firebase/auth';
import { DEFAULT_USER_ADDRESS } from '@/lib/distance';
import { normalize, priceBucket, extractBestDiscountPercent } from '@/lib/restaurantUtils';

export default function RestaurantsPage() {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFoodTypes, setActiveFoodTypes] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'discount' | 'name'>('distance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [distances, setDistances] = useState<Record<string, number | null>>({});
  const [, setLoadingDistances] = useState(false);
  const [, setMounted] = useState(false);
  const chipBaseClass = 'filter-chip rounded-full px-3 py-1 transition-colors border';

  // Handle sort button click - toggle direction if same key, otherwise set new key
  function handleSortClick(key: typeof sortBy) {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  }

  useEffect(() => {
    setMounted(true);
    const fetchDistances = async () => {
      try {
        setLoadingDistances(true);
        const response = await fetch(
          `/api/distances?userAddress=${encodeURIComponent(DEFAULT_USER_ADDRESS)}`
        );
        if (response.ok) {
          const distancesData = await response.json();
          setDistances(distancesData);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingDistances(false);
      }
    };

    fetchDistances();
  }, []);

  const allFoodTypes = useMemo(
    () =>
      Array.from(
        new Set((data as Restaurant[]).flatMap((r: Restaurant) => r.foodTypes ?? []))
      ).sort(),
    []
  );
  const allTags = useMemo(
    () => Array.from(new Set((data as Restaurant[]).flatMap((r) => r.tags ?? []))).sort(),
    []
  );

  const results = useMemo(() => {
    const name = normalize(search);

    const filtered = (data as Restaurant[]).filter((r) => {
      const matchName = name ? normalize(r.name).includes(name) : true;
      const matchFood =
        activeFoodTypes.length === 0 ||
        (r.foodTypes ?? []).some((t) => activeFoodTypes.includes(t));
      const matchTags =
        activeTags.length === 0 || (r.tags ?? []).some((t) => activeTags.includes(t));

      return matchName && matchFood && matchTags;
    });

    const sorted = filtered.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'price':
          return (priceBucket(a.priceRange) - priceBucket(b.priceRange)) * dir;
        case 'discount':
          return (extractBestDiscountPercent(a) - extractBestDiscountPercent(b)) * dir;
        case 'name':
          return normalize(a.name).localeCompare(normalize(b.name)) * dir;
        default:
          const da = distances[a.id] ?? Number.POSITIVE_INFINITY;
          const db = distances[b.id] ?? Number.POSITIVE_INFINITY;
          return (da - db) * dir;
      }
    });

    return sorted;
  }, [search, activeFoodTypes, activeTags, sortBy, sortDir, distances]);

  const { user, loading } = useAuth();

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch {}
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between text-sm">
        {loading ? (
          <span>Checking auth…</span>
        ) : user ? (
          <div className="flex items-center gap-2">
            <span>Signed in as {user.email ?? user.uid}</span>
            <button onClick={handleSignOut} className="rounded-full border px-3 py-1">
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span>Not signed in</span>
            <Link href="/login" className="underline">
              Log in
            </Link>
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="site-logo" role="img" aria-label="FoodBuddy Logo" />
      </div>

      <h1 className="text-2xl font-bold mb-4 text-center">Find restaurants near NEU-Oak</h1>

      <div className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full rounded-2xl border px-4 py-3 text-sm"
        />
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="rounded-2xl border px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700"
          aria-expanded={showFilters}
          aria-controls="filters"
        >
          {showFilters ? 'Hide filters' : 'Show filters'}
        </button>
      </div>

      {showFilters && (
        <div id="filters" className="mt-3 rounded-2xl border p-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="font-medium mb-2">Food types</div>
              <div className="flex flex-wrap gap-2">
                {allFoodTypes.map((t: string) => {
                  const on = activeFoodTypes.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() =>
                        setActiveFoodTypes((prev) =>
                          on ? prev.filter((x) => x !== t) : [...prev, t]
                        )
                      }
                      className={`${chipBaseClass} ${on ? 'filter-chip--active' : ''}`}
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
                {allTags.map((t: string) => {
                  const on = activeTags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() =>
                        setActiveTags((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))
                      }
                      className={`${chipBaseClass} ${on ? 'filter-chip--active' : ''}`}
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

      <div className="mt-6 mb-2 text-sm font-medium">Sort</div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: 'distance', label: 'Distance' },
          { key: 'price', label: 'Price' },
          { key: 'discount', label: 'Discount' },
          { key: 'name', label: 'Name' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleSortClick(opt.key as typeof sortBy)}
            className="sort-btn rounded-full px-4 py-2 text-sm border"
            style={
              sortBy === opt.key 
                ? { backgroundColor: '#9ca3af', color: '#ffffff', borderColor: '#000000' } 
                : { backgroundColor: '#ffffff', color: '#000000', borderColor: '#000000' }
            }
          >
            {opt.label} {sortBy === opt.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
        ))}
      </div>

      <div className="mb-2 text-sm text-neutral-600 dark:text-white">
        Showing {results.length} results
      </div>

      <div className="flex flex-col gap-3">
        {results.map((r) => {
          const d = distances[r.id];
          const str = d !== undefined && d !== null ? `${d.toFixed(1)} mi` : undefined;
          return <RestaurantCard key={r.id} restaurant={r} distance={str} />;
        })}
      </div>
    </div>
  );
}
