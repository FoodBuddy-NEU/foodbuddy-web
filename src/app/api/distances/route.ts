import { NextRequest, NextResponse } from "next/server";
import { calculateDistancesForRestaurants, DEFAULT_USER_ADDRESS } from "@/lib/distance";
import data from "@/data/restaurants.json";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get("userAddress") || DEFAULT_USER_ADDRESS;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const restaurants = (data as any[]).map((r: any) => ({
      id: r.id,
      address: r.address,
    }));

    // Calculate distances for all restaurants
    const distances = await calculateDistancesForRestaurants(restaurants, userAddress);

    // Return as object for easy lookup
    const distancesObj: Record<string, number | null> = {};
    distances.forEach((value, key) => {
      distancesObj[key] = value;
    });

    return NextResponse.json(distancesObj);
  } catch (error) {
    console.error("Distance calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate distances" },
      { status: 500 }
    );
  }
}
