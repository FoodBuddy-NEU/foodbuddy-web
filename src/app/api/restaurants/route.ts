import { NextResponse } from 'next/server';
import data from '@/data/restaurants.json';

/**
 * GET /api/restaurants
 * Returns the list of all restaurants
 */
export async function GET() {
  try {
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch restaurants:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
  }
}
