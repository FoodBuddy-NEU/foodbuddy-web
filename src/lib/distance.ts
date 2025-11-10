/**
 * Google Maps Distance Calculation Utility
 * Calculates distance between two addresses using Google Maps API
 */

const DEFAULT_USER_ADDRESS = '5000 MacArthur Blvd, Oakland, CA';

// Cache for geocoding results to reduce API calls
const geocodeCache: Map<string, { lat: number; lng: number }> = new Map();

/**
 * Geocode an address to get latitude and longitude
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address) || null;
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set');
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coords = { lat: location.lat, lng: location.lng };

      // Cache the result
      geocodeCache.set(address, coords);

      return coords;
    }

    console.warn(`Could not geocode address: ${address}`);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 * (Used as fallback when Google Maps Distance Matrix API is not available)
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance between restaurant address and user address
 */
export async function calculateDistance(
  restaurantAddress: string,
  userAddress: string = DEFAULT_USER_ADDRESS
): Promise<number | null> {
  try {
    // Geocode both addresses
    const [userCoords, restaurantCoords] = await Promise.all([
      geocodeAddress(userAddress),
      geocodeAddress(restaurantAddress),
    ]);

    if (!userCoords || !restaurantCoords) {
      console.warn('Could not geocode one or both addresses');
      return null;
    }

    // Calculate distance using Haversine formula
    const distance = haversineDistance(
      userCoords.lat,
      userCoords.lng,
      restaurantCoords.lat,
      restaurantCoords.lng
    );

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error('Distance calculation error:', error);
    return null;
  }
}

/**
 * Calculate distances for multiple restaurants
 */
export async function calculateDistancesForRestaurants(
  restaurants: Array<{ id: string; address: string }>,
  userAddress: string = DEFAULT_USER_ADDRESS
): Promise<Map<string, number | null>> {
  const distances = new Map<string, number | null>();

  for (const restaurant of restaurants) {
    const distance = await calculateDistance(restaurant.address, userAddress);
    distances.set(restaurant.id, distance);
  }

  return distances;
}

export { DEFAULT_USER_ADDRESS };
