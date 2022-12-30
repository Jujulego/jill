import Ajv from 'ajv';

import { container } from './inversify.config';
import { Logger } from './logger.service';

// Bind
container.bind(Ajv).toDynamicValue(() => {
  const logger = container.get(Logger);
  return new Ajv({
    allErrors: true,
    logger: logger.child({ label: 'ajv' }),
    strict: process.env.NODE_ENV === 'development' ? 'log' : true,
    verbose: true,
  });
}).inSingletonScope();

export { Ajv };
