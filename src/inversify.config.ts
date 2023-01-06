import ink from 'ink';
import { Container, decorate, injectable, interfaces } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import 'reflect-metadata';

// Constants
export const INK_APP: interfaces.ServiceIdentifier<ink.Instance> = Symbol.for('jujulego:jill:InkApp');
export const SERVICES_CONFIG: interfaces.ServiceIdentifier<ServicesConfig> = Symbol.for('jujulego:jill:ServicesConfig');

// Types
export interface ServicesConfig {
  jobs?: number;
}

// Container
export const container = new Container();

// Utilities
export const { lazyInject, lazyInjectNamed } = getDecorators(container);

/**
 * Register class as a service
 */
export function Service(): ClassDecorator {
  return (cls) => {
    decorate(injectable(), cls);
    container.bind(cls).toSelf().inSingletonScope();

    return cls;
  };
}
