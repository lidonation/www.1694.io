import { locales } from '@/constants';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { AppContextProvider } from '@/context/context';
import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { Poppins } from 'next/font/google';
import { notFound } from 'next/navigation';
import '@/assets/styles/globals.css';
import { ThemeProvider } from '@mui/material';
import theme from '@/assets/theme';
import ClientAnalyticsWrapper from '@/components/analytics/ClientAnalyticsWrapper';

const poppins = Poppins({
  weight: ['400'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export function generateStaticParams() {
  // Generate static params for each locale, used in static generation methods.
  return locales.variants.map((locale) => ({ locale }));
}

// Define common metadata for the application.
export const metadata = {
  title: 'Voltaire DRep Campaign Module',
  description:
    'Town Halls and Campaigns for Voltaire DReps and their communities.',
};

async function RootLayout({ children, params }) {
  // Root layout component, sets up locale, loads messages, and wraps the app with providers.
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  if (!locales.variants.includes(locale)) notFound();

  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    // Set the document language
    <html lang={locale} className={poppins.variable}>
      {/* Apply font class and suppress hydration warning. */}
      <body suppressHydrationWarning={true}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
              <AppContextProvider>
                {children}
                <ClientAnalyticsWrapper />
              </AppContextProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export default RootLayout;
