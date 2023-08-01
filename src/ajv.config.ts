import Ajv from 'ajv';
import { type interfaces as int } from 'inversify';

import { container } from './inversify.config.ts';
import { Logger } from './commons/logger.service.ts';

// Symbols
export const AJV: int.ServiceIdentifier<Ajv.default> = Symbol('jujulego:jill:Ajv');

// Setup
container
  .bind(AJV)
  .toDynamicValue(({ container }) => {
    const logger = container.get(Logger);

    return new (Ajv as typeof Avj.default)({
      allErrors: true,
      logger: logger.child({ label: 'ajv' }),
      strict: process.env.NODE_ENV === 'development' ? 'log' : true,
    });
  })
  .inSingletonScope();

