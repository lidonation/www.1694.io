import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const config = {
  output: 'standalone',
  reactStrictMode: true,
};

export default withNextIntl(config);
