import { notFound } from "next/navigation";
import Link from "next/link";
import data from "@/data/restaurants.json";
import type { Deal } from "@/types/restaurant";

type Restaurant = typeof data[number];

export default async function DealDetailPage({ params }: { params: Promise<{ id: string; dealId: string }> }) {
  const { id, dealId } = await params;
  const restaurant: Restaurant | undefined = data.find((r) => r.id === id);
  if (!restaurant) return notFound();

  const deal = restaurant.deals?.find((d) => d.id === dealId) as Deal | undefined;
  if (!deal) return notFound();

  // Type assertion for optional properties used in the deal details section
  const dealDetails = deal as Deal & Record<string, string | undefined>;

  // Build validity lines
  const validity: string[] = [];
  if (deal.validFrom) validity.push(`Valid from: ${deal.validFrom}`);
  if (deal.validTo) validity.push(`Valid through: ${deal.validTo}`);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href={`/restaurants/${restaurant.id}`} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">← Back</Link>
      </div>

      <h1 className="text-2xl font-bold">{deal.title}</h1>

      {typeof deal.description === "string" && deal.description ? (
        <div className="mt-4 text-sm text-neutral-700 dark:text-neutral-300">{deal.description}</div>
      ) : (
        <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">No additional description provided.</div>
      )}

      {validity.length > 0 && (
        <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
          {validity.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {/* 1. Expiration */}
        {validity.length > 0 && (
          <section className="rounded-md border p-4 text-sm">
            <div className="font-medium mb-2">1. Expiration (Validity)</div>
            {validity.map((l) => <div key={l} className="text-sm text-neutral-600 dark:text-neutral-400">{l}</div>)}
          </section>
        )}

        {/* 2. Eligibility & Restrictions */}
        {(dealDetails.eligibility || dealDetails.restrictions) && (
          <section className="rounded-md border p-4 text-sm">
            <div className="font-medium mb-2">2. Eligibility &amp; Restrictions</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {dealDetails.eligibility ? <div>{dealDetails.eligibility}</div> : null}
              {dealDetails.restrictions ? <div>{dealDetails.restrictions}</div> : null}
            </div>
          </section>
        )}

        {/* 3. Time of Use */}
        {deal.timeOfUse && (
          <section className="rounded-md border p-4 text-sm">
            <div className="font-medium mb-2">3. Time of Use</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">{deal.timeOfUse}</div>
          </section>
        )}

        {/* 4. Quantity & Usage Limits */}
        {deal.limits && (
          <section className="rounded-md border p-4 text-sm">
            <div className="font-medium mb-2">4. Quantity & Usage Limits</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">{deal.limits}</div>
          </section>
        )}

        {/* 5. Refund & Cash Value */}
        {(deal.refundPolicy || deal.cashValue) && (
          <section className="rounded-md border p-4 text-sm">
            <div className="font-medium mb-2">5. Refund & Cash Value</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {deal.refundPolicy ? <div>{deal.refundPolicy}</div> : null}
              {deal.cashValue ? <div>{deal.cashValue}</div> : null}
            </div>
          </section>
        )}

        {/* 6. Legal & Brand Disclaimer */}
        {deal.disclaimer && (
          <section className="rounded-md border p-4 text-sm">
            <div className="font-medium mb-2">6. Legal & Brand Disclaimer</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">{deal.disclaimer}</div>
          </section>
        )}
      </div>
    </div>
  );
}
