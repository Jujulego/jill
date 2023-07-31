import { swc } from 'rollup-plugin-swc3';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    exclude: ['e2e/**'],
    setupFiles: ['tests/setup.ts'],
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
          decoratorMetadata: true,
          react: {
            runtime: 'automatic'
          }
        },
        paths: {
          '@/src/*': ['./src/*'],
          '@/tools/*': ['./tools/*']
        }
      }
    })
  ]
});
