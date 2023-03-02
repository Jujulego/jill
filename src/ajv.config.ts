import Ajv from 'ajv';
import { type interfaces as int } from 'inversify';

import { container } from './inversify.config.js';
import { Logger } from './commons/logger.service.js';

// Symbols
export const AJV: int.ServiceIdentifier<Ajv.default> = Symbol('jujulego:jill:Ajv');

// Setup
container
  .bind(AJV)
  .toDynamicValue(() => {
    const logger = container.get(Logger);

    return new Ajv.default({
      allErrors: true,
      logger: logger.child({ label: 'ajv' }),
      strict: process.env.NODE_ENV === 'development' ? 'log' : true,
    });
  })
  .inSingletonScope();

