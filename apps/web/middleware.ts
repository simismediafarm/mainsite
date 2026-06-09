import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');
    const validUser = process.env.ADMIN_BASIC_AUTH_USER || 'admin';
    const validPass = process.env.ADMIN_BASIC_AUTH_PASSWORD;

    if (validPass && user === validUser && pwd === validPass) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication Required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="SIMIS Secure Area"' },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};
