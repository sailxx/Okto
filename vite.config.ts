import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [svelte()],
  build: mode === 'android' ? {
    outDir: 'android/app/build/generated/oktoWeb/okto',
    emptyOutDir: true,
    rollupOptions: { input: 'planner.html' },
  } : undefined,
  test: { include: ['tests/**/*.test.ts'], passWithNoTests: true },
}));
