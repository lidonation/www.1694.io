import createMiddleware from 'next-intl/middleware';
import { locales } from './constants';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: locales.variants,
  defaultLocale: locales.defaultLocale,
});

export const config = {
  matcher: ['/((?!_next).*)'],
  runtime: 'edge',
};

function getLocale() {
  return locales.defaultLocale;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.match(/\.(svg|png|ico)$/)) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);
  if (intlResponse) return intlResponse;

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
