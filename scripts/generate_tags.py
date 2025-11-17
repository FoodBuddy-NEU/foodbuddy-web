

import os
import openai
import json
from dotenv import load_dotenv

# WHY: This script reads restaurant data, sends it to OpenAI, and gets tags like solo-friendly, healthy, low cost, and food category.

load_dotenv(".env.local")  # Load environment variables from .env.local

# Debug: print API key to verify loading
api_key = os.getenv("OPENAI_API_KEY")
print("API Key loaded:", api_key)

# WHY: This script reads restaurant data, sends it to OpenAI, and gets tags like solo-friendly, healthy, low cost, and food category.

def get_openai_tags(restaurant_info):
    prompt = f"""
    Based on the following restaurant information, return these tags as true/false:
    - solo-friendly
    - popular
    - healthy
    - low cost
    - solo-meal
    - food category (e.g. Sichuan, Cantonese, Japanese, etc)

    A restaurant is considered popular if it has more than 100 reviews on Yelp, maintains an average rating of 4.0 stars or above, is frequently listed as a top or trending restaurant, is described as famous, well-known, a local favorite, or crowded, has long wait times, or is recommended by food guides or influencers. Use these criteria to determine the 'popular' tag.

    A restaurant is considered healthy if its menu focuses on nutritious, balanced, and low-calorie options. Indicators: dishes are low in fat, sugar, and salt; use fresh vegetables, lean meats, whole grains; offers vegetarian, vegan, or organic options; avoids deep-fried, heavily processed, or sugary foods.

    Restaurant info: {restaurant_info}

    Return format: {{'solo_friendly': bool, 'popular': bool, 'healthy': bool, 'low_cost': bool, 'solo_meal': bool, 'category': str}}
    """
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    with open("src/data/restaurants.json", "r", encoding="utf-8") as f:
        restaurants = json.load(f)
    results = []
    for restaurant in restaurants:
        info = json.dumps(restaurant, ensure_ascii=False)
        tags = get_openai_tags(info)
        results.append({"name": restaurant.get("name"), "tags": tags})
    with open("src/data/restaurant_tags.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Tags generated and saved to src/data/restaurant_tags.json")
