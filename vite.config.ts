import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  // Note: Server-side secrets like GEMINI_API_KEY are NEVER injected into client bundles.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
