import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

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
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
