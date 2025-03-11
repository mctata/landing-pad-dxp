import { NextRequest, NextResponse } from 'next/server';
import { trackError } from '../route';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Track the error
    trackError();
    
    // Log the error details for potential investigation
    console.error('[Client Error]', data.context || 'unknown', data.error, data.stack || '');
    
    // Return a 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Log the error but still return success to the client
    console.error('Error tracking client error:', error);
    return new NextResponse(null, { status: 204 });
  }
}