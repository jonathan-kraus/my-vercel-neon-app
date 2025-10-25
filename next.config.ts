import type { NextConfig } from 'next';
import path from 'path';

// const nextConfig: NextConfig = {
//   // When the workspace contains multiple package-lock files Next.js tries to infer
//   // the project root which can emit a warning during build. Setting
//   // `outputFileTracingRoot` explicitly avoids that warning.
//   outputFileTracingRoot: path.resolve(__dirname),
// };
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  experimental: {
    turbopack: false,
  },
};
export default nextConfig;
