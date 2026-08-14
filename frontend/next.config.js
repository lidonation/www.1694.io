const withNextIntl = require('next-intl/plugin')();
const path = require('path');
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    '@tailwindcss/postcss',
    'tailwindcss',
    'lightningcss',
    '@tailwindcss/node',
  ],
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true,
      layers: true,
    };

    // Treat .wasm files as async WebAssembly modules
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Avoid bundling Node core modules in the client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
};
const sassOptions = {
  includePaths: [path.join(__dirname, 'assets/styles')],
};
// This line integrates the NextIntl library with the Next.js configuration.
// It enhances the Next.js application with internationalization features provided by NextIntl,
// applying the configurations defined in `nextConfig`.
module.exports = withNextIntl(nextConfig);

// Injected content via Sentry wizard below

// const { withSentryConfig } = require('@sentry/nextjs');

// module.exports = withSentryConfig(
//   module.exports,
//   sassOptions,
//   {
//     // For all available options, see:
//     // https://github.com/getsentry/sentry-webpack-plugin#options
//
//     // Suppresses source map uploading logs during build
//     silent: true,
//   },
//   {
//     // For all available options, see:
//     // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
//
//     // Upload a larger set of source maps for prettier stack traces (increases build time)
//     widenClientFileUpload: true,
//
//     // Transpiles SDK to be compatible with IE11 (increases bundle size)
//     transpileClientSDK: true,
//
//     // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
//     tunnelRoute: '/monitoring',
//
//     // Hides source maps from generated client bundles
//     hideSourceMaps: true,
//
//     // Automatically tree-shake Sentry logger statements to reduce bundle size
//     disableLogger: true,
//
//     // Enables automatic instrumentation of Vercel Cron Monitors.
//     // See the following for more information:
//     // https://docs.sentry.io/product/crons/
//     // https://vercel.com/docs/cron-jobs
//     automaticVercelMonitors: true,
//   },
// );
