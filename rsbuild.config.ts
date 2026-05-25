import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

// loadEnv reads .env.[mode] based on NODE_ENV (development by default for `rsbuild dev`)
const { parsed } = loadEnv();
const devApiTarget = parsed.PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './app.jsx',
    },
  },
  html: {
    template: './index.html',
  },
  output: {
    distPath: {
      root: 'build',
      assets: 'assets',
    },
  },
  server: {
    publicDir: {
      name: 'public',
    },
    proxy: {
      '/api': devApiTarget,
    },
  },
});
