import createMiddleware from 'next-intl/middleware';
import { locales } from './constants';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: locales.variants,
  defaultLocale: locales.defaultLocale,
});

export default function middleware(request) {
  if (request.nextUrl.pathname.match(/\.(svg|png|ico|css|js)$/)) {
    return NextResponse.next();
  }


  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next|api).*)'],
};
