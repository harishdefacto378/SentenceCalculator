import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],

  source: {
    entry: {
      index: './app.jsx',
    },

    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(
        process.env.VITE_API_URL || "http://localhost:5000"
      ),
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
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});