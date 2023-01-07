import ink from 'ink';
import { Container, decorate, injectable, interfaces } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import 'reflect-metadata';

// Constants
/** @deprecated */
export const INK_APP: interfaces.ServiceIdentifier<ink.Instance> = Symbol.for('jujulego:jill:InkApp');

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
