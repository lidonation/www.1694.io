// Import getRequestConfig from next-intl for configuring request-level internationalization.
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from './constants';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.variants.includes(locale)) notFound();
  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
