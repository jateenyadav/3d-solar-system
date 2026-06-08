import { defineConfig } from 'vite';

// Base path is set so assets resolve correctly when served from
// https://<user>.github.io/3d-solar-system/ on GitHub Pages.
export default defineConfig({
  base: '/3d-solar-system/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
