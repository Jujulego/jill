import { swc } from 'rollup-plugin-swc3';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['tools/setup.ts'],
    threads: false,
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
        paths: {
          '@/src/*': ['./src/*'],
          '@/tools/*': ['./tools/*']
        }
      }
    })
  ]
});
