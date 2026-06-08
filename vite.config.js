import { defineConfig } from 'vite';

// Relative base so the built assets resolve correctly regardless of where
// the site is served from: root on Netlify (/) or a subpath on GitHub Pages
// (/3d-solar-system/). Using './' keeps every emitted URL relative.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
