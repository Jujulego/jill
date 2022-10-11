import { Container } from 'inversify';

// Constants
export const TOKENS = {
  GlobalConfig: Symbol.for('GlobalConfig'),
  Logger: Symbol.for('Logger'),
};

// Types
export interface GlobalConfig {
  jobs?: number;
  verbose: number;
}

// Container
export const container = new Container({ skipBaseClassChecks: true });
