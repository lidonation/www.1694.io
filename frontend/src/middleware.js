import { NextResponse } from 'next/server';

export default function middleware(request) {
  // Skip middleware for static files and API routes
  if (
    request.nextUrl.pathname.match(/\.(svg|png|ico|css|js)$/) ||
    request.nextUrl.pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Simple redirect to /en if no locale is present
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/en') && !pathname.startsWith('/de')) {
    request.nextUrl.pathname = `/en${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|static).*)'],
};
