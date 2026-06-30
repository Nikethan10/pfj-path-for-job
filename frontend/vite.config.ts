import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split large vendor libraries into their own chunks for faster loads.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth'],
          charts: ['recharts'],
          flow: ['reactflow'],
          editor: ['@monaco-editor/react'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
