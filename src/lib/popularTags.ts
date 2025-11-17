// Tag rule for popular restaurants
export function popularTagRule({ yelp_review_count, yelp_rating }: { yelp_review_count: number, yelp_rating: number }): boolean {
  return yelp_review_count > 100 && yelp_rating >= 4.0;
}
