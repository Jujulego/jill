import type { Config } from 'jest';

const config: Config = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  roots: [
    '<rootDir>/tests',
    '<rootDir>/tools',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },

  // Coverage
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*'],
  coverageDirectory: 'coverage',
};

export default config;
