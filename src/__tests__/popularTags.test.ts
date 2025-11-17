import { popularTagRule } from '../lib/popularTags';

describe('popularTagRule', () => {
  it('should return true for restaurant with >100 reviews and rating >= 4.0', () => {
    expect(popularTagRule({ yelp_review_count: 150, yelp_rating: 4.2 })).toBe(true);
    expect(popularTagRule({ yelp_review_count: 1000, yelp_rating: 4.0 })).toBe(true);
  });

  it('should return false for restaurant with <=100 reviews', () => {
    expect(popularTagRule({ yelp_review_count: 100, yelp_rating: 4.2 })).toBe(false);
    expect(popularTagRule({ yelp_review_count: 99, yelp_rating: 4.5 })).toBe(false);
  });

  it('should return false for restaurant with rating < 4.0', () => {
    expect(popularTagRule({ yelp_review_count: 200, yelp_rating: 3.9 })).toBe(false);
    expect(popularTagRule({ yelp_review_count: 500, yelp_rating: 2.0 })).toBe(false);
  });
});
