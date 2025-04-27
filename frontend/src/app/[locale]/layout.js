import { locales } from '@/constants';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { AppContextProvider } from '@/context/context';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { Poppins } from 'next/font/google';
import { notFound } from 'next/navigation';
import '@/assets/styles/globals.css';
import dynamic from 'next/dynamic';
import '@fontsource/poppins';
import { ThemeProvider } from '@mui/material';
import theme from '@/assets/theme';
import PageBanner from '@/components/atoms/PageBanner';
import { routing } from '@/i18n/routing';
import { getMessages } from 'next-intl/server';
const poppins = Poppins({
  weight: '400',
  style: 'normal',
  subsets: ['devanagari'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Define common metadata for the application.
export const metadata = {
  title: 'Voltaire DRep Campaign Module',
  description:
    'Town Halls and Campaigns for Voltaire DReps and their communities.',
};
// Dynamically imported ClientScriptLoader with no SSR
const SprigClientScriptLoader = dynamic(
  () => import('@/components/analytics/SprigClientScriptLoader'),
  { ssr: false },
);
const FathomClientScriptLoader = dynamic(
  () => import('@/components/analytics/AnalyticsLoader'),
  { ssr: false },
);

async function RootLayout({ children, params: { locale } }) {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    // Set the document language
    <html lang={locale}>
      <head>
        <title>{metadata.title}</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      {/* Apply font class and suppress hydration warning. */}
      <body className={poppins.className} suppressHydrationWarning={true}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
              <AppContextProvider>
                <PageBanner />
                {children}
              </AppContextProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
          <SprigClientScriptLoader />
          <FathomClientScriptLoader />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export default RootLayout;
