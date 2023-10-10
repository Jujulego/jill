import { Logger, withLabel } from '@jujulego/logger';
import Ajv from 'ajv';
import { type interfaces as int } from 'inversify';

import { container } from './inversify.config.ts';

// Symbols
export const AJV: int.ServiceIdentifier<Ajv.default> = Symbol('jujulego:jill:Ajv');

// Setup
container
  .bind(AJV)
  .toDynamicValue(({ container }) => {
    const logger = container.get(Logger);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (Ajv as any)({
      allErrors: true,
      logger: logger.child(withLabel('ajv')),
      strict: process.env.NODE_ENV === 'development' ? 'log' : true,
    });
  })
  .inSingletonScope();

