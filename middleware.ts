import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if user is trying to access dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('github-agent-auth');
    
    // If no auth cookie or invalid value, redirect to login
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*'
  ]
};
