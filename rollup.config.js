import { codecovRollupPlugin } from '@codecov/rollup-plugin';
import { sentryRollupPlugin } from '@sentry/rollup-plugin';
import { swc } from '@jujulego/vite-plugin-swc';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json' with { type: 'json' };

/** @type {import('rollup').RollupOptions} */
const options = {
  input: {
    main: 'src/main.ts',
    instrument: 'src/instrument.ts',
  },
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
    chunkFileNames: '[name].js',
    generatedCode: 'es5',
    manualChunks: {
     'parser': ['./src/cli/parser.js'],
    }
  },
  plugins: [
    nodeResolve({ exportConditions: ['node'] }),
    json(),
    swc(),
    codecovRollupPlugin({
      enableBundleAnalysis: !!process.env.CODECOV_TOKEN,
      bundleName: 'jill',
      uploadToken: process.env.CODECOV_TOKEN,
    }),
    sentryRollupPlugin({
      org: 'jujulego',
      project: 'jill',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: pkg.version,
      },
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayShadowDom: true,
        excludeReplayIframe: true,
        excludeReplayWorker: true,
      }
    })
  ],
  external: [
    ...(Object.keys(pkg.dependencies)),
    'react/jsx-runtime',
    'reflect-metadata/lite',
    'yargs/helpers',
  ],
};

export default options;
