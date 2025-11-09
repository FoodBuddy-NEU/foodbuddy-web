"use client";

import Image from "next/image";
import Link from "next/link";
import BookmarkButton from "@/components/BookmarkButton";
import type { Restaurant } from "@/types/restaurant";


interface Props {
  restaurant: Restaurant & { id: string | number };
  className?: string;
  distance?: string;
  primaryDeal?: string;
}

export default function RestaurantCard({ restaurant, className, distance, primaryDeal }: Props) {
  const id = String(restaurant.id);

  return (
    <article className={className}>
      <div className="overflow-hidden rounded-lg border hover:shadow-md transition-shadow">
        {/* Two-column layout: left = navigable area, right = action rail */}
        <div className="flex">
          {/* LEFT: full clickable area to details */}
          <Link
            href={`/restaurants/${id}`}
            aria-label={`View details for ${restaurant.name}`}
            className="group block flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {/* Media */}
            {restaurant.images && restaurant.images.length > 0 && (
              <Image
                src={restaurant.images[0].url || restaurant.images[0].public_id || ""}
                alt={restaurant.images[0].alt || restaurant.name}
                width={1200}
                height={800}
                className="h-48 w-full object-cover"
              />
            )}

            {/* Body */}
            <div className="p-4">
              {/* Title */}
              <div className="text-lg font-semibold group-hover:underline underline-offset-2">
                {restaurant.name}
              </div>

              {/* Distance + Address */}
              {(distance || restaurant.address) && (
                <div className="mt-1 text-sm dark:text-neutral-300">
                  {distance ? <span className="mr-2">{distance}</span> : null}
                  {restaurant.address ? <span>{restaurant.address}</span> : null}
                </div>
              )}

              {/* Meta line */}
              <div className="mt-1 text-sm dark:text-neutral-400">
                <span className="mr-2">{restaurant.priceRange ?? "-"}</span>
                <span className="mr-2">•</span>
                <span className="mr-2">Rating {(restaurant.rating ?? 0).toFixed(1)}★</span>
                <span>• {(restaurant.foodTypes ?? []).join(", ")}</span>
              </div>

              {/* Primary deal */}
              {primaryDeal && (
                <div className="mt-2 text-sm dark:text-neutral-300">
                  {primaryDeal}
                </div>
              )}

              {/* Tags */}
              {restaurant.tags && restaurant.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {restaurant.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs rounded-full border px-3 py-1 dark:text-neutral-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>

          {/* RIGHT: action rail with vertical divider; bookmark centered vertically */}
          <div
            className="w-25 shrink-0 border-l flex items-center justify-center p-3"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <BookmarkButton
              restaurantId={id}
              className="flex items-center gap-1 text-sm underline-offset-2 hover:underline"
            />
          </div>
        </div>
      </div>
    </article>
  );
}