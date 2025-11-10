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
