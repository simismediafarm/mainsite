import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // Default basic auth uses the Supabase database password provided earlier
    if (user === 'admin' && pwd === '@Zasper123.') {
      return NextResponse.next();
    }
  }
  
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="SIMIS Secure Area"',
    },
  });
}

// Only run middleware for admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
