import swc from '@rollup/plugin-swc';
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
  esbuild: false,
  plugins: [
    tsconfigPaths(),
    (swc as unknown as typeof swc.default)()
  ]
});
