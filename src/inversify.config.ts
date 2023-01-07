import { Container, decorate, injectable } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import 'reflect-metadata';

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
