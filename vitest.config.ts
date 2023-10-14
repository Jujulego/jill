import { swc } from '@jujulego/vite-plugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['tools/setup.ts'],
    threads: false,
    coverage: {
      include: ['src/**', 'tools/**'],
      reporter: ['text', 'lcovonly'],
    }
  },
  plugins: [
    tsconfigPaths(),
    swc()
  ]
});
