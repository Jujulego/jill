import type { Config } from 'jest';

const config: Config = {
  roots: [
    '<rootDir>/e2e'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/e2e/setup.ts'
  ],
  testTimeout: 10000,
  moduleNameMapper: {
    '#ansi-styles': 'ansi-styles',
    '#supports-color': 'supports-color'
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(ansi-styles|chalk|is-unicode-supported|log-symbols|parse-ms|pretty-ms|supports-color))'
  ],
};

export default config;
