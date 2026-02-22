import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Game-Hub-App/games/Monk/dist/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@babylonjs/core/')) {
            return 'babylon-core';
          }
          if (id.includes('/node_modules/')) {
            return 'vendor';
          }
          return undefined;
        }
      }
    }
  }
});
