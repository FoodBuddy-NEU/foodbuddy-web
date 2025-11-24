import type { Restaurant, Deal } from '@/types/restaurant';

export function formatDistance(d?: number): string | null {
  if (typeof d !== 'number' || Number.isNaN(d)) return null;
  return `${d.toFixed(1)} mi`;
}

export function getRestaurantSummary(restaurant: Record<string, unknown>): string {
  const foodTypes =
    Array.isArray(restaurant.foodTypes) && restaurant.foodTypes.length
      ? restaurant.foodTypes.join(', ')
      : 'N/A';
  const priceRange = restaurant.priceRange ?? 'N/A';
  const rating = typeof restaurant.rating === 'number' ? restaurant.rating.toFixed(1) : '-';
  return `${foodTypes} • ${priceRange} • ⭐ ${rating}`;
}

export function getDealValidString(deal: Record<string, unknown>): string {
  if (!(deal.validFrom || deal.validTo)) return '';
  return `${deal.validFrom ? ` ${deal.validFrom}` : ''}${deal.validFrom && deal.validTo ? ' – ' : deal.validTo ? ' until ' : ''}${deal.validTo ?? ''}`;
}

export function normalize(str: string): string {
  return str.toLowerCase().trim();
}

export function priceBucket(p?: string): number {
  if (!p) return Number.POSITIVE_INFINITY;
  return p.length;
}

export function extractBestDiscountPercent(r: Restaurant): number {
  const texts: string[] = [];
  (r.deals as Deal[] | undefined)?.forEach((d) => {
    if (d.title) texts.push(String(d.title));
    if (typeof d.description === 'string') texts.push(d.description);
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
  return max;
}
