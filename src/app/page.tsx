'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
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
  const [loadingDistances, setLoadingDistances] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only fetch distances after component mounts (client-side only)
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
        } else {
          console.error('Failed to fetch distances');
        }
      } catch (error) {
        console.error('Error fetching distances:', error);
      } finally {
        setLoadingDistances(false);
      }
    };

    fetchDistances();
  }, []);

  // derive facets from data
  const allFoodTypes = useMemo(
    () =>
      Array.from(
        new Set((data as Restaurant[]).flatMap((r: Restaurant) => r.foodTypes ?? []))
      ).sort(),
    []
  );
  const allTags = useMemo(
    () =>
      Array.from(new Set((data as Restaurant[]).flatMap((r: Restaurant) => r.tags ?? []))).sort(),
    []
  );

  const results = useMemo(() => {
    const name = normalize(search);

    // 1) filter by name + facets
    let list = (data as Restaurant[]).filter((r: Restaurant) => {
      const nameOk = name ? normalize(r.name).includes(name) : true;

      const foodOk =
        activeFoodTypes.length === 0 ||
        (r.foodTypes ?? []).some((t: string) => activeFoodTypes.includes(t));

      const tagOk =
        activeTags.length === 0 || (r.tags ?? []).some((t: string) => activeTags.includes(t));

      return nameOk && foodOk && tagOk;
    });

    // 2) sort
    list = [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'price':
          return (priceBucket(a.priceRange) - priceBucket(b.priceRange)) * dir;
        case 'discount':
          return (extractBestDiscountPercent(a) - extractBestDiscountPercent(b)) * dir;
        case 'name':
          return normalize(a.name).localeCompare(normalize(b.name)) * dir;
        case 'distance':
        default:
          // Use calculated distances from API
          const da =
            distances[a.id] ??
            (a as Restaurant & { distance: number }).distance ??
            Number.POSITIVE_INFINITY;
          const db =
            distances[b.id] ??
            (b as Restaurant & { distance: number }).distance ??
            Number.POSITIVE_INFINITY;
          return (da - db) * dir;
      }
    });

    return list;
  }, [search, activeFoodTypes, activeTags, sortBy, sortDir, distances]);

  function handleSortClick(key: typeof sortBy) {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  }

  const { user, loading } = useAuth();

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch {
      // noop: you can add a toast/error UI later if needed
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Auth status header */}
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
          className="w-full rounded-2xl border px-4 py-3 text-sm"
          aria-label="Search by name"
        />
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="rounded-2xl border px-4 py-2 text-sm"
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
                      className={`rounded-full border px-3 py-1 ${on ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
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
                      className={`rounded-full border px-3 py-1 ${on ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
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
          {
            key: 'distance',
            label: `Distance ${sortBy === 'distance' ? (sortDir === 'asc' ? '↑' : '↓') : ''}`,
          },
          {
            key: 'price',
            label: `Price ${sortBy === 'price' ? (sortDir === 'asc' ? '↑' : '↓') : ''}`,
          },
          {
            key: 'discount',
            label: `Discount ${sortBy === 'discount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}`,
          },
          {
            key: 'name',
            label: `Name ${sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}`,
          },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleSortClick(opt.key as typeof sortBy)}
            className={`rounded-full px-4 py-2 text-sm border ${
              sortBy === opt.key ? 'bg-black text-white dark:bg-white dark:text-black' : ''
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-2 text-sm text-neutral-600">
        {mounted && loadingDistances && 'Loading distances...'}
        {mounted && !loadingDistances && `Showing ${results.length} results`}
        {!mounted && `Showing ${results.length} results`}
      </div>

      <div className="flex flex-col gap-3">
        {results.map((r: Restaurant) => {
          const distance = distances[r.id];
          const distanceStr =
            distance !== null && distance !== undefined ? `${distance.toFixed(1)} mi` : undefined;
          return <RestaurantCard key={r.id} restaurant={r} distance={distanceStr} />;
        })}
      </div>
    </div>
  );
}
