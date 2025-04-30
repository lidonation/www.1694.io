import createMiddleware from 'next-intl/middleware';
import { locales } from './constants';
import { NextResponse } from 'next/server';

// Setup next-intl middleware
const intlMiddleware = createMiddleware({
  locales: locales.variants,
  defaultLocale: locales.defaultLocale,
});

// Define which paths middleware should apply to
export const config = {
  matcher: ['/((?!_next).*)'],
};

function getLocale() {
  return locales.defaultLocale;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip serving assets like .svg, .png, .ico
  if (pathname.match(/\.(svg|png|ico)$/)) {
    return NextResponse.next();
  }

  // Run the internationalization middleware
  const intlResponse = intlMiddleware(request);
  if (intlResponse) return intlResponse;

  // If no locale is found in the path, redirect to default locale
  const pathnameHasLocale = locales.variants.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (!pathnameHasLocale) {
    const locale = getLocale();
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  return NextResponse.next();
}
