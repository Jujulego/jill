import { swc } from '@jujulego/vite-plugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['tools/setup.ts'],
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
