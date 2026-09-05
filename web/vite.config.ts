import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Resolve shared schemas location: handles local dev host, Docker container, and local mirror
const sharedDir = fs.existsSync(path.resolve(__dirname, '../shared'))
  ? path.resolve(__dirname, '../shared')
  : fs.existsSync('/shared')
  ? '/shared'
  : path.resolve(__dirname, 'shared');

// Determine API proxy target: inside Docker network use service name 'api', on host use localhost
const isDocker = fs.existsSync('/.dockerenv');
const apiTarget = process.env.API_TARGET || (isDocker ? 'http://api:5000' : 'http://localhost:5000');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'decimal.js', replacement: path.resolve(__dirname, 'node_modules/decimal.js') },
      // Intercept any relative "../../../shared" or "../../shared" import and resolve to sharedDir
      { find: /^(\.\.\/)+shared/, replacement: sharedDir },
      { find: '@shared', replacement: sharedDir },
      { find: 'shared', replacement: sharedDir },
    ],
  },
  server: {
    port: 5173,
    fs: {
      allow: [
        __dirname,
        path.resolve(__dirname, '..'),
        '/shared',
        sharedDir,
      ],
    },
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
