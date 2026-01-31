import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin') || '';

  // Define allowed origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:4200',
    'https://traindiary-new-frontend.vercel.app',
  ];

  // Check if the origin is allowed
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Handle preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    
    if (isAllowedOrigin || !origin) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
    
    return response;
  }

  // Handle actual requests
  const response = NextResponse.next();
  
  if (isAllowedOrigin || !origin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Vary', 'Origin');

  return response;
}

// Match all API routes
export const config = {
  matcher: '/api/:path*',
};
