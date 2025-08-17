import { ContextService } from '@/src/commons/context.service.js';
import { CURRENT } from '@/src/constants.js';
import { container } from '@/src/inversify.config.js';
import { injectable } from 'inversify';

// Application
@injectable()
export class JillApplication {}

container.bind(JillApplication)
  .toSelf()
  .inTransientScope()
  .whenTargetIsDefault();

container.bind(JillApplication)
  .toDynamicValue(({ container }) => {
    const ctx = container.get(ContextService);
    const app = ctx.application;

    if (!app) {
      throw new Error('Cannot inject current application, it not yet defined');
    }

    return app;
  })
  .whenTargetNamed(CURRENT);
