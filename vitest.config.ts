import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { swc } from 'rollup-plugin-swc3';
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
    swc({
      jsc: {
        loose: true,
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: true,
          dynamicImport: true
        },
        transform: {
          react: {
            runtime: 'automatic'
          }
        },
        baseUrl: dirname(fileURLToPath(import.meta.url)),
        paths: {
          '@/src/*': ['./src/*'],
          '@/tools/*': ['./tools/*']
        }
      }
    })
  ]
});
