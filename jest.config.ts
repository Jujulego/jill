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
    '^.+\\.(t|j)sx?$': ['@swc/jest', { jsc: { loose: true } }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(ansi-styles|chalk|is-unicode-supported|log-symbols|parse-ms|pretty-ms|supports-color))'
  ],

  // Coverage
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*'],
  coverageDirectory: 'coverage',
};

export default config;
