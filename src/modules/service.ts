import { decorate, injectable, interfaces as int } from 'inversify';

import { container } from '@/src/inversify.config.ts';

// Types
export interface OnServiceActivate {
  onServiceActivate(context: int.Context): void;
}

// Decorators
/**
 * Register class as a service
 */
export function Service(): ClassDecorator {
  return (cls) => {
    decorate(injectable(), cls);
    container.bind(cls).toSelf().inSingletonScope()
      .onActivation((ctx, service) => {
        if ('onServiceActivate' in service) {
          service.onServiceActivate(ctx);
        }

        return service;
      });

    return cls;
  };
}
