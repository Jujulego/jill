import { decorate, injectable } from 'inversify';

import { container } from '@/src/inversify.config.ts';

// Decorators
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
