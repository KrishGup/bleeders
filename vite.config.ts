import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// `base: './'` keeps every asset URL relative, so the same build works from a
// domain root, a GitHub Pages project sub-path (/bleeders/), or a file preview.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
