import { ValidateFunction } from 'ajv';
import { cosmiconfig } from 'cosmiconfig';
import { interfaces } from 'inversify';
import path from 'node:path';

import schema from '../assets/schema.json';

import { Ajv } from './ajv.service';
import { container } from './inversify.config';
import { Logger } from './logger.service';
import * as process from 'process';

// Types
export interface Config {
  jobs?: number;
  plugins?: string[];
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
  const logger = container.get(Logger).child({ label: 'config' });
  // Load config
  const explorer = cosmiconfig('jill');
  const loaded = await explorer.search();
  const config = loaded?.config ?? {};

  // Validate
  const ajv = container.get(Ajv);
  const validator = container.get<ValidateFunction<Config>>(CONFIG_VALIDATOR);

  if (!validator(config)) {
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

  // Compute paths relative to config file
  if (loaded) {
    const base = path.dirname(loaded.filepath);

    config.plugins = config.plugins?.map((plugin) => path.resolve(base, plugin));
  }

  // Apply on logger
  if (config.verbose) {
    container.get(Logger).level = config.verbose;
  }

  if (loaded) {
    logger.verbose(`Loaded ${loaded.filepath} config file`);
  }

  return config;
}).inSingletonScope();
