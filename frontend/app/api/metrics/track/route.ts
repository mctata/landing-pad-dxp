import { NextRequest, NextResponse } from 'next/server';
import { trackRequest } from '../route';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Track the request
    if (data && data.path) {
      trackRequest(data.path);
    }
    
    // Return a 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Log the error but still return success to the client
    console.error('Error tracking request:', error);
    return new NextResponse(null, { status: 204 });
  }
}