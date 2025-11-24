import requests
import json
import time

# WHY: This script uses Yelp Fusion API to fetch restaurant info (review count, rating, etc) for tagging.
# You need to get a Yelp API key from https://www.yelp.com/developers/v3/manage_app and set it in .env.local as YELP_API_KEY

from dotenv import load_dotenv
import os
load_dotenv(".env.local")

YELP_API_KEY = os.getenv("YELP_API_KEY")
HEADERS = {"Authorization": f"Bearer {YELP_API_KEY}"}
SEARCH_URL = "https://api.yelp.com/v3/businesses/search"
DETAIL_URL = "https://api.yelp.com/v3/businesses/{}"

# Example: search for restaurants by name and location

def get_yelp_info(name, location):
    params = {
        "term": name,
        "location": location,
        "limit": 1
    }
    resp = requests.get(SEARCH_URL, headers=HEADERS, params=params)
    data = resp.json()
    if data.get("businesses"):
        biz = data["businesses"][0]
        biz_id = biz["id"]
        detail_resp = requests.get(DETAIL_URL.format(biz_id), headers=HEADERS)
        detail = detail_resp.json()
        return {
            "yelp_id": biz_id,
            "yelp_name": biz["name"],
            "yelp_rating": biz["rating"],
            "yelp_review_count": biz["review_count"],
            "yelp_url": biz["url"]
        }
    return None

if __name__ == "__main__":
    with open("src/data/restaurants.json", "r", encoding="utf-8") as f:
        restaurants = json.load(f)
    results = []
    for r in restaurants:
        name = r.get("name")
        location = r.get("address") or r.get("location") or "Boston, MA"
        info = get_yelp_info(name, location)
        results.append({"name": name, "yelp": info})
        time.sleep(1)  # avoid rate limit
    with open("src/data/yelp_info.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Yelp info saved to src/data/yelp_info.json")
