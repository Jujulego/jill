import { Logger, LogLevel, withLabel } from '@jujulego/logger';
import { type interfaces as int } from 'inversify';
import os from 'node:os';
import path from 'node:path';

import { AJV } from '@/src/ajv.config.ts';
import { LogGateway } from '@/src/commons/logger/log.gateway.ts';
import { container } from '@/src/inversify.config.ts';
import { ExitException } from '@/src/utils/exit.ts';
import { workerCache } from '@/src/utils/worker-cache.ts';

import { CONFIG_OPTIONS } from './config-options.ts';
import { type IConfig } from './types.ts';
import { CONFIG_EXPLORER, CONFIG_VALIDATOR } from './utils.ts';

// Symbols
export const CONFIG: int.ServiceIdentifier<IConfig> = Symbol('jujulego:jill:config');

// Loader
export async function configLoader() {
  const logger = container.get(Logger).child(withLabel('config'));

  const options = container.get(CONFIG_OPTIONS);
  const explorer = container.get(CONFIG_EXPLORER);
  const validator = container.get(CONFIG_VALIDATOR);

  // Load file
  const loaded = await explorer.search();
  const config = loaded?.config ?? {};

  // Apply options from cli
  if (options.jobs) config.jobs = options.jobs;
  if (options.verbose) config.verbose = options.verbose;

  // Apply default
  config.jobs ??= (os.cpus().length - 1);

  // Validate
  if (!validator(config)) {
    const ajv = container.get(AJV);
    const errors = ajv.errorsText(validator.errors, { separator: '\n- ', dataVar: 'config' });

    logger.error(`Errors in config file:\n- ${errors}`);
    throw new ExitException(1);
  }

  // Apply on logger
  if (config.verbose) {
    container.get(LogGateway).level = LogLevel[config.verbose];
  }

  if (loaded) {
    // Resolve paths relative to config file
    const base = path.dirname(loaded.filepath);
    config.plugins = config.plugins?.map((plugin) => path.resolve(base, plugin));

    logger.verbose(`Loaded ${loaded.filepath} config file`);
  }

  logger.debug`Loaded config:\n#!json:${config}`;

  return config;
}

container
  .bind(CONFIG)
  .toDynamicValue(async () => await workerCache('jujulego:jill:config', configLoader))
  .inSingletonScope();
