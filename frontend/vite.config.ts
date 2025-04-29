import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { OutputAsset } from 'rollup';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'https://backend-pfe.azurewebsites.net',
        changeOrigin: true,
        secure: false
      }
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
  base: '/',
  publicDir: 'public',
  assetsInclude: ['**/*.pdf'],
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo: { name?: string }) => {
          if (assetInfo.name?.endsWith('.pdf')) {
            return 'pdfs/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react-pdf'],
  },
  css: {
    postcss: './postcss.config.cjs',
    modules: {
      localsConvention: 'camelCase',
    },
  },
});