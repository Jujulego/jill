import { swc } from '@jujulego/vite-plugin-swc';
import json from '@rollup/plugin-json';

/** @type {import('rollup').RollupOptions} */
const options = {
  input: ['src/main.ts', 'src/index.ts'],
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    swc(),
    json(),
  ],
  external: [
    '@jujulego/aegis',
    '@jujulego/event-tree',
    '@jujulego/logger',
    '@jujulego/quick-tag',
    '@jujulego/tasks',
    '@jujulego/utils',
    'ajv',
    'chalk',
    'chalk-template',
    'cosmiconfig',
    'glob',
    'ink',
    'ink-spinner',
    'inversify',
    'inversify-inject-decorators',
    'log-symbols',
    'moo',
    'node:async_hooks',
    'node:fs',
    'node:fs/promises',
    'node:os',
    'node:path',
    'node:worker_threads',
    'normalize-package-data',
    'path-scurry',
    'pretty-ms',
    'react',
    'react/jsx-runtime',
    'reflect-metadata',
    'semver',
    'slugify',
    'yargs',
    'yargs/helpers',
  ],
};

export default options;