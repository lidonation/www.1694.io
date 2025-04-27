import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: ['./messages/en.json', './messages/de.json'],
  },
});

const config = {
  output: 'standalone',
  reactStrictMode: true,
};

export default withNextIntl(config);
