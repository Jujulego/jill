import { Container } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import 'reflect-metadata';

// Constants
export const INK_APP = Symbol.for('InkApp');
export const GLOBAL_CONFIG = Symbol.for('GlobalConfig');
export const CURRENT_PROJECT = Symbol.for('CurrentProject');

// Types
export interface GlobalConfig {
  jobs?: number;
  verbose: number;
}

// Container
export const container = new Container({
  skipBaseClassChecks: true,
});

// Utilities
export const { lazyInject } = getDecorators(container);
