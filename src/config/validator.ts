import { interfaces as int } from 'inversify';
import { ValidateFunction } from 'ajv';

import schema from '@/src/assets/schema.json';
import { AJV } from '@/src/ajv.config';
import { container } from '@/src/inversify.config';

import { Config } from './types';

// Symbols
export const CONFIG_VALIDATOR: int.ServiceIdentifier<ValidateFunction<Config>> = Symbol('jujulego:jill:ConfigValidator');

// Setup
container
  .bind(CONFIG_VALIDATOR)
  .toDynamicValue((context) => {
    const ajv = context.container.get(AJV);
    return ajv.compile<Config>(schema);
  })
  .inSingletonScope();
