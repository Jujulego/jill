import ajv, { ValidateFunction } from 'ajv';
import { cosmiconfig } from 'cosmiconfig';
import { interfaces } from 'inversify';

import schema from '../assets/schema.json';

import { Ajv } from './ajv.service';
import { container } from './inversify.config';
import { Logger } from './logger.service';

// Types
export interface Config {
  jobs?: number;
  verbose?: 'info' | 'verbose' | 'debug';
}

// Symbols
export const CONFIG: interfaces.ServiceIdentifier<Config> = Symbol('jujulego:jill:Config');
export const CONFIG_VALIDATOR: interfaces.ServiceIdentifier<ValidateFunction<Config>> = Symbol('jujulego:jill:ConfigValidator');

// Config loader
container.bind(CONFIG_VALIDATOR).toDynamicValue(() => {
  const ajv = container.get(Ajv);
  return ajv.compile<Config>(schema);
});

container.bind(CONFIG).toDynamicValue(async () => {
  // Load config
  const explorer = cosmiconfig('jill');
  const loaded = await explorer.search();
  const config = loaded?.config ?? {};

  // Validate
  const ajv = container.get(Ajv);
  const validator = container.get<ValidateFunction<Config>>(CONFIG_VALIDATOR);

  if (!validator(config)) {
    const logger = container.get(Logger);

    const errors = ajv.errorsText(validator.errors, {
      separator: '\n- ',
      dataVar: 'config'
    });

    logger.error(
      'Errors in config file:\n' +
      `- ${errors}`
    );
    process.exit(1);
  }

  // Apply on logger
  if (config.verbose) {
    const logger = container.get(Logger);
    logger.level = config.verbose;
  }

  if (loaded) {
    const logger = container.get(Logger);
    logger.verbose(`Loaded ${loaded.filepath} config file`);
  }

  return config;
}).inSingletonScope();
