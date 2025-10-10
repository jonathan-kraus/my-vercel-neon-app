import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // When the workspace contains multiple package-lock files Next.js tries to infer
  // the project root which can emit a warning during build. Setting
  // `outputFileTracingRoot` explicitly avoids that warning.
  outputFileTracingRoot: path.resolve(__dirname),
  compiler: {
    // This is the key change: it will be true only for 'pnpm build'
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
