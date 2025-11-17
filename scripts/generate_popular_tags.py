import json

# WHY: This script reads yelp_info.json and generates a popular tag for each restaurant based on review count and rating.
# Rule: popular = True if yelp_review_count > 100 and yelp_rating >= 4.0

with open("src/data/yelp_info.json", "r", encoding="utf-8") as f:
    data = json.load(f)

results = []
for item in data:
    yelp = item.get("yelp", {})
    review_count = yelp.get("yelp_review_count", 0)
    rating = yelp.get("yelp_rating", 0)
    popular = review_count > 100 and rating >= 4.0
    results.append({
        "name": item.get("name"),
        "popular": popular,
        "yelp_review_count": review_count,
        "yelp_rating": rating,
        "yelp_url": yelp.get("yelp_url")
    })

with open("src/data/popular_tags.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Popular tags generated and saved to src/data/popular_tags.json")
