import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Cache tax rates to avoid repeated API calls
const taxRateCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zipCode');

  if (!zipCode) {
    return NextResponse.json({ error: 'Zip code is required' }, { status: 400 });
  }

  // Check cache first
  const cached = taxRateCache[zipCode];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ taxRate: cached.rate, zipCode, cached: true });
  }

  // If no OpenAI API key, return default rate
  if (!openai) {
    const defaultRate = 0.0875;
    return NextResponse.json({ taxRate: defaultRate, zipCode, default: true });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a US sales tax rate expert. Your job is to provide the EXACT combined sales tax rate (state + county + city + district taxes) for a given US zip code.

Important considerations:
- Include ALL applicable taxes: state, county, city, and special district taxes
- California has varying rates by city/district (e.g., Berkeley CA 94704 = 10.25%, Oakland CA = 10.25%, San Francisco = 8.625%)
- Be precise to the nearest 0.125% as that's how tax rates are typically set
- If unsure about exact local rates, use the most likely combined rate for that area

Respond with ONLY the tax rate as a decimal number (e.g., 0.1025 for 10.25%). No other text.`
        },
        {
          role: 'user',
          content: `What is the exact combined sales tax rate for zip code ${zipCode}? Include state, county, city, and any special district taxes.`
        }
      ],
      temperature: 0,
      max_tokens: 20,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    const taxRate = parseFloat(responseText);

    if (isNaN(taxRate) || taxRate < 0 || taxRate > 0.15) {
      // Default to California average if parsing fails
      const defaultRate = 0.0875;
      taxRateCache[zipCode] = { rate: defaultRate, timestamp: Date.now() };
      return NextResponse.json({ taxRate: defaultRate, zipCode, default: true });
    }

    // Cache the result
    taxRateCache[zipCode] = { rate: taxRate, timestamp: Date.now() };
    return NextResponse.json({ taxRate, zipCode });
  } catch (error) {
    console.error('Error fetching tax rate:', error);
    // Return a default California tax rate on error
    return NextResponse.json({ taxRate: 0.0875, zipCode, error: true });
  }
}
