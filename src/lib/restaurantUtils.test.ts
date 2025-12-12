import { formatDistance, getRestaurantSummary, getDealValidString } from './restaurantUtils';

describe('formatDistance', () => {
  it('formats valid number', () => {
    expect(formatDistance(1.234)).toBe('1.2 mi');
    expect(formatDistance(0)).toBe('0.0 mi');
    expect(formatDistance(10)).toBe('10.0 mi');
  });
  it('returns null for invalid input', () => {
    expect(formatDistance(undefined)).toBeNull();
    expect(formatDistance(NaN)).toBeNull();
    expect(formatDistance('abc' as unknown as number)).toBeNull();
  });
});

describe('getRestaurantSummary', () => {
  it('returns correct summary for full data', () => {
    const restaurant: Record<string, unknown> = {
      foodTypes: ['Pizza', 'Burger'],
      priceRange: '$$',
      rating: 4.5,
    };
    expect(getRestaurantSummary(restaurant)).toBe('Pizza, Burger • $$ • ⭐ 4.5');
  });
  it('handles missing fields', () => {
    expect(getRestaurantSummary({})).toBe('N/A • N/A • ⭐ -');
    expect(getRestaurantSummary({ foodTypes: [], priceRange: undefined, rating: undefined })).toBe(
      'N/A • N/A • ⭐ -'
    );
  });
});

describe('getDealValidString', () => {
  it('returns empty string if no dates', () => {
    expect(getDealValidString({})).toBe('');
  });
  it('formats validFrom only', () => {
    expect(getDealValidString({ validFrom: '2024-01-01' })).toBe(' 2024-01-01');
  });
  it('formats validTo only', () => {
    expect(getDealValidString({ validTo: '2024-02-01' })).toBe(' until 2024-02-01');
  });
  it('formats both validFrom and validTo', () => {
    expect(getDealValidString({ validFrom: '2024-01-01', validTo: '2024-02-01' })).toBe(
      ' 2024-01-01 – 2024-02-01'
    );
  });
});
