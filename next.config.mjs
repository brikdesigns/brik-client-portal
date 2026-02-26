import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@bds/components': path.resolve(__dirname, 'brik-bds/components'),
      '@bds/tokens': path.resolve(__dirname, 'brik-bds/tokens'),
    };
    return config;
  },
};

export default nextConfig;
