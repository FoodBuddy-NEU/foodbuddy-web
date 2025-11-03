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
        <section className="rounded-md border p-4 bg-white dark:bg-neutral-900 text-sm">
          <div className="font-medium mb-2">1. Expiration (Validity)</div>
          {validity.length > 0 ? (
            validity.map((l) => <div key={l} className="text-sm text-neutral-600 dark:text-neutral-400">{l}</div>)
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Please specify clear expiration, e.g. &quot;Valid through June 30, 2025&quot;. For e-coupons the system should automatically expire them after the date. Gift-card style coupons may have different legal rules.</div>
          )}
        </section>

        {/* 2. Eligibility & Restrictions */}
        <section className="rounded-md border p-4 bg-white dark:bg-neutral-900 text-sm">
          <div className="font-medium mb-2">2. Eligibility &amp; Restrictions</div>
          {(dealDetails.eligibility || dealDetails.restrictions) ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {dealDetails.eligibility ? <div>{dealDetails.eligibility}</div> : null}
              {dealDetails.restrictions ? <div>{dealDetails.restrictions}</div> : null}
            </div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Examples: &quot;Dine-in only&quot;, &quot;Not valid for delivery&quot;, &quot;Excludes alcohol and combo meals&quot;, &quot;Valid at participating locations only&quot;, &quot;Not valid with any other offer or discount&quot;.</div>
          )}
        </section>

        {/* 3. Time of Use */}
        <section className="rounded-md border p-4 bg-white dark:bg-neutral-900 text-sm">
          <div className="font-medium mb-2">3. Time of Use</div>
          {deal.timeOfUse ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">{deal.timeOfUse}</div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Examples: &quot;Valid Monday–Thursday only&quot;, &quot;Not valid on holidays&quot;, &quot;Available 2 PM–5 PM daily (Happy Hour special)&quot;.</div>
          )}
        </section>

        {/* 4. Quantity & Usage Limits */}
        <section className="rounded-md border p-4 bg-white dark:bg-neutral-900 text-sm">
          <div className="font-medium mb-2">4. Quantity & Usage Limits</div>
          {deal.limits ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">{deal.limits}</div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Examples: &quot;Limit one coupon per transaction&quot;, &quot;Minimum purchase of $10 required&quot;, &quot;One-time use only (per customer)&quot;.</div>
          )}
        </section>

        {/* 5. Refund & Cash Value */}
        <section className="rounded-md border p-4 bg-white dark:bg-neutral-900 text-sm">
          <div className="font-medium mb-2">5. Refund & Cash Value</div>
          {(deal.refundPolicy || deal.cashValue) ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {deal.refundPolicy ? <div>{deal.refundPolicy}</div> : null}
              {deal.cashValue ? <div>{deal.cashValue}</div> : null}
            </div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Typical notes: &quot;No cash value&quot;, &quot;Void if sold or transferred&quot;, &quot;Coupon will not be reissued if canceled&quot;.</div>
          )}
        </section>

        {/* 6. Legal & Brand Disclaimer */}
        <section className="rounded-md border p-4 bg-white dark:bg-neutral-900 text-sm">
          <div className="font-medium mb-2">6. Legal & Brand Disclaimer</div>
          {deal.disclaimer ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">{deal.disclaimer}</div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              <div>Void where prohibited by law.</div>
              <div>The restaurant reserves the right to modify or cancel the offer at any time.</div>
              <div>Unauthorized reproduction or sale of coupon is prohibited.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
