import { notFound } from "next/navigation";
import { restaurants } from "@/data/restaurants";
import Link from "next/link";


export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = restaurants.find((r) => r.id === id);
  if (!data) {
    notFound();
  }

  const summary = `${data.foodTypes?.length ? data.foodTypes.join(", ") : "N/A"} • ${
    data.priceRange ?? "N/A"
  } • ⭐ ${data.rating?.toFixed?.(1) ?? "-"}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back to home */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
        >
          ← Back
        </Link>
      </div>

      <h1 className="text-2xl font-bold">{data.name}</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{summary}</p>

      {/* Deals */}
      <h2 className="mt-6 text-lg font-semibold">Deals</h2>
      <div className="mt-2 space-y-3">
        {data.deals?.length ? (
          data.deals.map((d) => {
            const valid =
              (d.validFrom || d.validTo) &&
              `${d.validFrom ? ` ${d.validFrom}` : ""}${
                d.validFrom && d.validTo ? " – " : d.validTo ? " until " : ""
              }${d.validTo ?? ""}`;
            return (
              <div
                key={d.id}
                className="rounded-xl border p-4 bg-white dark:bg-neutral-900"
              >
                <div className="font-medium">{d.title}</div>
                {d.description ? (
                  <div className="mt-1 text-sm">{d.description}</div>
                ) : null}
                {valid ? (
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {valid}
                  </div>
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
        {data.menus?.map((m) => (
          <div key={m.id}>
            <div className="font-medium">{m.title}</div>
            <div className="mt-2 space-y-2">
              {m.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
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
        {data.reviews?.length ? (
          data.reviews.map((rev, idx) => (
            <div
              key={`${rev.userName}-${idx}`}
              className="rounded-xl border p-4 bg-white dark:bg-neutral-900"
            >
              <div className="font-medium">{rev.userName}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">{`⭐ ${rev.rating}`}</div>
              <div className="mt-2 text-sm">{rev.comment}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            No reviews
          </div>
        )}
      </div>
    </div>
  );
}