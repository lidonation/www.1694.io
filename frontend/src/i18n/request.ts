import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import path from 'path';
import fs from 'fs';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  return {
    locale,
    messages,
  };
});
