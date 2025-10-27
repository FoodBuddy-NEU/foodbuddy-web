import Link from "next/link";
import data from "@/data/restaurants.json";

type Restaurant = typeof data[number];

type Props = { restaurant: Restaurant };

function formatDistance(d?: number) {
  if (typeof d !== "number" || Number.isNaN(d)) return null;
  return `${d.toFixed(1)} mi`;
}

export default function RestaurantCard({ restaurant }: Props) {
  const primaryDeal = restaurant.deals?.[0]?.title ?? "No discount";
  const distance = formatDistance((restaurant as any).distance);

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="block">
      <div className="rounded-2xl border p-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
        {/* Name */}
        <div className="text-lg font-semibold text-black dark:text-white">
          {restaurant.name}
        </div>

        {/* Distance (new-first) + Address */}
        {(distance || restaurant.address) && (
          <div className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
            {distance ? <span className="mr-2">{distance}</span> : null}
            {restaurant.address ? <span>{restaurant.address}</span> : null}
          </div>
        )}

        {/* Meta line */}
        <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          <span className="mr-2">{restaurant.priceRange ?? "-"}</span>
          <span className="mr-2">•</span>
          <span className="mr-2">
            Rating {(restaurant.rating ?? 0).toFixed(1)}★
          </span>
          <span>• {(restaurant.foodTypes ?? []).join(", ")}</span>
        </div>

        {/* Primary deal */}
        <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          {primaryDeal}
        </div>

        {/* Tags */}
        {restaurant.tags && restaurant.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {restaurant.tags.map((t) => (
              <span
                key={t}
                className="text-xs rounded-full border px-3 py-1 text-neutral-700 dark:text-neutral-300"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
