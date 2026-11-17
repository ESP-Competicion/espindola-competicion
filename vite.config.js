import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-assetto': {
        target: 'https://br.assettohosting.com:10314',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-assetto/, '/api/v1')
      }
    }
  }
});