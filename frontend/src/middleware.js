import createMiddleware from 'next-intl/middleware';
import { locales } from './constants';
import { NextResponse } from 'next/server';

export default createMiddleware({
  locales: locales.variants,
  defaultLocale: locales.defaultLocale,
});

export const config = {
  matcher: ['/((?!_next).*)'],
};

export function middleware(request) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.variants.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return NextResponse.next();
  if (pathname.match(/\.(svg|png|ico)$/)) return NextResponse.next();
  // Redirect if there is no locale
  const locale = locales.defaultLocale;

  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}
