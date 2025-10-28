//import type { NextConfig } from 'next';
//import path from 'path';
import type { Configuration } from 'webpack';

// const nextConfig: NextConfig = {
//   // When the workspace contains multiple package-lock files Next.js tries to infer
//   // the project root which can emit a warning during build. Setting
//   // `outputFileTracingRoot` explicitly avoids that warning.
//   outputFileTracingRoot: path.resolve(__dirname),
// };
const path = require('path');

const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),

  webpack(config: Configuration) {
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

module.exports = nextConfig;

export default nextConfig;
