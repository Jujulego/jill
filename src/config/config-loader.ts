import { interfaces as int } from 'inversify';
import path from 'node:path';

import { AJV } from '@/src/ajv.config';
import { container } from '@/src/inversify.config';
import { Logger } from '@/src/commons/logger.service';

import { CONFIG_OPTIONS } from './config-options';
import { type IConfig } from './types';
import { CONFIG_EXPLORER, CONFIG_VALIDATOR } from './utils';

// Symbols
export const CONFIG: int.ServiceIdentifier<IConfig> = Symbol('jujulego:jill:config');

// Loader
export async function configLoader() {
  const logger = container.get(Logger).child({ label: 'config' });

  const options = container.get(CONFIG_OPTIONS);
  const explorer = container.get(CONFIG_EXPLORER);
  const validator = container.get(CONFIG_VALIDATOR);

  // Load file
  const loaded = await explorer.search();
  const config = loaded?.config ?? {};

  // Apply options from cli
  config.jobs = options.jobs;
  config.verbose = options.verbose;

  // Validate
  if (!validator(config)) {
    const ajv = container.get(AJV);
    const errors = ajv.errorsText(validator.errors, { separator: '\n- ', dataVar: 'config' });

    logger.error(`Errors in config file:\n- ${errors}`);
    process.exit(1);

    return {};
  }

  if (loaded) {
    // Resolve paths relative to config file
    const base = path.dirname(loaded.filepath);
    config.plugins = config.plugins?.map((plugin) => path.resolve(base, plugin));

    // Apply on logger
    if (config.verbose) {
      container.get(Logger).level = config.verbose;
    }

    logger.verbose(`Loaded ${loaded.filepath} config file`);
  }

  return config;
}

container
  .bind(CONFIG)
  .toDynamicValue(configLoader)
  .inSingletonScope();
