import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgrPlugin from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
    tsconfigPaths({
      parseNative: false,
    }),
    svgrPlugin(),
    {
      name: 'custom-hmr-control',
      handleHotUpdate({ file, server }) {
        if (file.includes('src/app/configs/')) {
          server.ws.send({
            type: 'full-reload',
          });
          return [];
        }
      },
    },
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'AGATE TOWER - Construction Monitoring System',
        short_name: 'AGATE TOWER',
        description: 'Construction Monitoring System',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon',
          }
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    outDir: 'build',
  },
  server: {
    host: '0.0.0.0',
    open: true,
    strictPort: false,
    port: 3002,
  },
  define: {
    'import.meta.env.VITE_PORT': JSON.stringify(process.env.PORT || 3002),
    global: 'window',
  },
  resolve: {
    alias: {
      '@': '/src',
      '@fuse': '/src/@fuse',
      '@history': '/src/@history',
      '@lodash': '/src/@lodash',
      '@mock-api': '/src/@mock-api',
      '@schema': '/src/@schema',
      'app/store': '/src/app/store',
      'app/shared-components': '/src/app/shared-components',
      'app/configs': '/src/app/configs',
      'app/theme-layouts': '/src/app/theme-layouts',
      'app/AppContext': '/src/app/AppContext',
    },
  },
  optimizeDeps: {
    include: [
      '@mui/icons-material',
      '@mui/material',
      '@mui/base',
      '@mui/styles',
      '@mui/system',
      '@mui/utils',
      '@emotion/cache',
      '@emotion/react',
      '@emotion/styled',
      'date-fns',
      'lodash',
    ],
    exclude: [],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
