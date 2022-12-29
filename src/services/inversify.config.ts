import ink from 'ink';
import { Container, interfaces } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import 'reflect-metadata';

// Constants
export const INK_APP: interfaces.ServiceIdentifier<ink.Instance> = Symbol.for('jujulego:jill:InkApp');
export const SERVICES_CONFIG: interfaces.ServiceIdentifier<ServicesConfig> = Symbol.for('jujulego:jill:ServicesConfig');
export const CURRENT = Symbol.for('jujulego:jill:Current');

// Types
export interface ServicesConfig {
  jobs?: number;
  verbose: number;
}

// Container
export const container = new Container();

// Utilities
export const { lazyInject } = getDecorators(container);
