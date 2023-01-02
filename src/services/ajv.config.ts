import Ajv from 'ajv';
import { interfaces as int } from 'inversify';

import { container } from './inversify.config';
import { Logger } from './logger.service';

// Symbols
export const AJV: int.ServiceIdentifier<Ajv> = Symbol('jujulego:jill:Ajv');

// Setup
container
  .bind(AJV).toDynamicValue(() => {
    const logger = container.get(Logger);

    return new Ajv({
      allErrors: true,
      logger: logger.child({ label: 'ajv' }),
      strict: process.env.NODE_ENV === 'development' ? 'log' : true,
    });
  })
  .inSingletonScope();
