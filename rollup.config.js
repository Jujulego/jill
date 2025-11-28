import { codecovRollupPlugin } from '@codecov/rollup-plugin';
import { swc } from '@jujulego/vite-plugin-swc';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { sentryRollupPlugin } from '@sentry/rollup-plugin';
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
  },
  plugins: [
    nodeResolve({exportConditions: ['node']}),
    commonjs(),
    json(),
    replace({
      preventAssignment: true,
      values: {
        'process.env[\'DEV\']': '"false"',
        'process.env.NODE_ENV': '"production"',
      }
    }),
    swc(),
    sentryRollupPlugin({
      org: 'jujulego',
      project: 'jill',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.SENTRY_AUTH_TOKEN,
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayShadowDom: true,
        excludeReplayIframe: true,
        excludeReplayWorker: true,
      },
      reactComponentAnnotation: {
        enabled: false,
      },
      release: {
        name: `${pkg.name}@${pkg.version}`,
        finalize: false,
      }
    }),
    codecovRollupPlugin({
      enableBundleAnalysis: !!process.env.CI,
      bundleName: 'jill',
      oidc: {
        useGitHubOIDC: true,
      },
    })
  ],
  external: [
    ...(Object.keys(pkg.dependencies)),
    'react-devtools-core',
    'reflect-metadata/lite',
    'typescript',
    'yargs/helpers',
  ],
};

export default options;
