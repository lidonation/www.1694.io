import { getRequestConfig } from 'next-intl/server';
import { locales } from '../constants';
import { notFound } from 'next/navigation';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.variants.includes(locale)) notFound();
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
