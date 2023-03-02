import type { Config } from 'jest';

const config: Config = {
  roots: [
    '<rootDir>/tests',
    '<rootDir>/tools',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '#ansi-styles': 'ansi-styles',
    '#supports-color': 'supports-color'
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(ansi-escapes|ansi-styles|auto-bind|chalk|ink|ink-spinner|ink-testing-library|is-unicode-supported|lodash-es|log-symbols|parse-ms|patch-console|pretty-ms|supports-color))'
  ],

  // Coverage
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*'],
  coverageDirectory: 'coverage',
};

export default config;
