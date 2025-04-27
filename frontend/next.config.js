const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: './messages/en.json',
  },
});

const config = { output: 'standalone', reactStrictMode: true };

module.exports = withNextIntl(config);