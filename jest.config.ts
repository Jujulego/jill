import type { Config } from 'jest';

const config: Config = {
  roots: [
    '<rootDir>/tests'
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
