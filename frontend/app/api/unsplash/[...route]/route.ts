import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_API_URL = 'https://api.unsplash.com';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * Middleware to handle Unsplash API requests
 * This acts as a proxy to avoid exposing API keys client-side
 */
async function unsplashApiRequest(route: string[], request: NextRequest) {
  // Check if API key is configured
  if (!UNSPLASH_ACCESS_KEY) {
    return NextResponse.json(
      { error: 'Unsplash API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Construct the target URL
    const path = route.join('/');
    const url = new URL(`${UNSPLASH_API_URL}/${path}`);
    
    // Copy search params from request
    const searchParams = new URL(request.url).searchParams;
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Make request to Unsplash API with authorization
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
      method: request.method,
      // Only include body for non-GET requests
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.errors?.[0] || 'Unsplash API error', details: errorData },
        { status: response.status }
      );
    }

    // Return the response data
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unsplash API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Unsplash API' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for Unsplash API requests
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  return unsplashApiRequest(params.route, request);
}

/**
 * POST handler for Unsplash API requests
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  return unsplashApiRequest(params.route, request);
}
