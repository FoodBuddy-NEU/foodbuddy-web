import { notFound } from "next/navigation";
import Link from "next/link";
import data from "@/data/restaurants.json";

type Restaurant = typeof data[number];

function formatDistance(d?: number) {
  if (typeof d !== "number" || Number.isNaN(d)) return null;
  return `${d.toFixed(1)} mi`;
}

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant: Restaurant | undefined = data.find((r) => r.id === id);
  if (!restaurant) notFound();

  const summary = `${restaurant.foodTypes?.length ? restaurant.foodTypes.join(", ") : "N/A"} • ${restaurant.priceRange ?? "N/A"} • ⭐ ${restaurant.rating?.toFixed?.(1) ?? "-"}`;

  const distance = formatDistance((restaurant as any).distance);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">← Back</Link>
      </div>

      <h1 className="text-2xl font-bold">{restaurant.name}</h1>

      {/* Address + Phone + Distance */}
      <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
        {distance ? <div>📍 {distance}</div> : null}
        {restaurant.address ? <div>{restaurant.address}</div> : null}
        {restaurant.phone ? <div>☎ {restaurant.phone}</div> : null}
      </div>

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{summary}</p>

      {/* Deals */}
      <h2 className="mt-6 text-lg font-semibold">Deals</h2>
      <div className="mt-2 space-y-3">
        {restaurant.deals?.length ? (
          restaurant.deals.map((d) => {
            const deal = d as any;
            const valid =
              (deal.validFrom || deal.validTo) &&
              `${deal.validFrom ? ` ${deal.validFrom}` : ""}${
                deal.validFrom && deal.validTo ? " – " : deal.validTo ? " until " : ""
              }${deal.validTo ?? ""}`;

            return (
              <div key={deal.id} className="rounded-xl border p-4 bg-white dark:bg-neutral-900">
                <div className="font-medium">{deal.title}</div>
                {typeof deal.description === "string" && deal.description ? (
                  <div className="mt-1 text-sm">{deal.description}</div>
                ) : null}
                {valid ? (
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{valid}</div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            There is no deal avaliable at the moment
          </div>
        )}
      </div>

      {/* Menus */}
      <h2 className="mt-8 text-lg font-semibold">Menu</h2>
      <div className="mt-2 space-y-6">
        {restaurant.menus?.map((m) => (
          <div key={m.id}>
            <div className="font-medium">{m.title}</div>
            <div className="mt-2 space-y-2">
              {m.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span>${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <h2 className="mt-8 text-lg font-semibold">Reviews</h2>
      <div className="mt-2 space-y-3">
        {restaurant.reviews?.length ? (
          restaurant.reviews.map((rev, idx) => (
            <div key={`${rev.userName}-${idx}`} className="rounded-xl border p-4 bg-white dark:bg-neutral-900">
              <div className="font-medium">{rev.userName}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">{`⭐ ${rev.rating}`}</div>
              <div className="mt-2 text-sm">{rev.comment}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-neutral-600 dark:text-neutral-400">No reviews</div>
        )}
      </div>
    </div>
  );
}
