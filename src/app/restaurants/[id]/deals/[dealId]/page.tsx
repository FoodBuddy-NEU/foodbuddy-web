import { notFound } from "next/navigation";
import Link from "next/link";
import data from "@/data/restaurants.json";

type Restaurant = typeof data[number];

export default async function DealDetailPage({ params }: { params: Promise<{ id: string; dealId: string }> }) {
  const { id, dealId } = await params;
  const restaurant: Restaurant | undefined = data.find((r) => r.id === id);
  if (!restaurant) return notFound();

  const deal = restaurant.deals?.find((d) => d.id === dealId) as any | undefined;
  if (!deal) return notFound();

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
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Please specify clear expiration, e.g. "Valid through June 30, 2025". For e-coupons the system should automatically expire them after the date. Gift-card style coupons may have different legal rules.</div>
          )}
        </section>

        {/* 2. Eligibility & Restrictions */}
        <section className="rounded-md border p-4 bg-white dark:bg-neutral-900 text-sm">
          <div className="font-medium mb-2">2. Eligibility & Restrictions</div>
          {(deal.eligibility || deal.restrictions) ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {deal.eligibility ? <div>{deal.eligibility}</div> : null}
              {deal.restrictions ? <div>{deal.restrictions}</div> : null}
            </div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Examples: "Dine-in only", "Not valid for delivery", "Excludes alcohol and combo meals", "Valid at participating locations only", "Not valid with any other offer or discount".</div>
          )}
        </section>

        {/* 3. Time of Use */}
        <section className="rounded-md border p-4 bg-white dark:bg-neutral-900 text-sm">
          <div className="font-medium mb-2">3. Time of Use</div>
          {deal.timeOfUse ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">{deal.timeOfUse}</div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Examples: "Valid Monday–Thursday only", "Not valid on holidays", "Available 2 PM–5 PM daily (Happy Hour special)".</div>
          )}
        </section>

        {/* 4. Quantity & Usage Limits */}
        <section className="rounded-md border p-4 bg-white dark:bg-neutral-900 text-sm">
          <div className="font-medium mb-2">4. Quantity & Usage Limits</div>
          {deal.limits ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">{deal.limits}</div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Examples: "Limit one coupon per transaction", "Minimum purchase of $10 required", "One-time use only (per customer)".</div>
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
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Typical notes: "No cash value", "Void if sold or transferred", "Coupon will not be reissued if canceled".</div>
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
