import type { Config } from 'jest';

const config: Config = {
  roots: [
    '<rootDir>/e2e'
  ],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
};

export default config;
