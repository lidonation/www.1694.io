import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: ['./messages/en.json', './messages/en.json'],
  },
});

const config = {
  output: 'standalone',
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@messages': path.resolve('./messages')
    };
    return config;
  },
};

export default withNextIntl(config);
