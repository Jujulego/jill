/// <reference types="vitest" />
import { swc } from '@jujulego/vite-plugin-swc';
import fs from 'node:fs/promises';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const e2eFiles = (await fs.readdir(path.join(import.meta.dirname, 'e2e')))
  .filter((file) => file.endsWith('.test.ts'))
  .map((file) => path.join(import.meta.dirname, 'e2e', file));

export default defineConfig({
  cacheDir: '.vite',
  test: {
    coverage: {
      include: ['src/**', 'tools/**'],
      reporter: ['text', 'lcovonly'],
    },
    globals: true,
    pool: 'forks',
    reporters: ['default', 'junit'],
    setupFiles: ['tools/setup.ts'],
    outputFile: {
      junit: 'junit-report.xml'
    },
    watchTriggerPatterns: [
      {
        pattern: /(bin|dist)\/.+\.js/,
        testsToRun: () => e2eFiles
      }
    ]
  },
  plugins: [
    tsconfigPaths(),
    swc()
  ]
});
