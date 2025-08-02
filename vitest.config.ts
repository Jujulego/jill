import { swc } from '@jujulego/vite-plugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    reporters: ['default', 'junit'],
    setupFiles: ['tools/setup.ts'],
    coverage: {
      include: ['src/**', 'tools/**'],
      reporter: ['text', 'lcovonly'],
    },
    outputFile: {
      junit: 'junit-report.xml'
    },
  },
  plugins: [
    tsconfigPaths(),
    swc()
  ]
});
