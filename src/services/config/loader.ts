import { interfaces as int } from 'inversify';
import path from 'node:path';

import { AJV } from '@/src/services/ajv.config';
import { container } from '@/src/services/inversify.config';
import { Logger } from '@/src/services/logger.service';

import { CONFIG_EXPLORER } from './explorer';
import { CONFIG_VALIDATOR } from './validator';
import { Config } from './types';

// Symbols
export const CONFIG: int.ServiceIdentifier<Config> = Symbol('jujulego:jill:Config');

// Loader
container
  .bind(CONFIG).toDynamicValue(async (ctx) => {
    const logger = ctx.container.get(Logger).child({ label: 'config' });
    const explorer = ctx.container.get(CONFIG_EXPLORER);
    const validator = ctx.container.get(CONFIG_VALIDATOR);

    // Load file
    const loaded = await explorer.search();
    const config = loaded?.config ?? {};

    // Validate
    if (!validator(config)) {
      const ajv = ctx.container.get(AJV);
      const errors = ajv.errorsText(validator.errors, { separator: '\n- ', dataVar: 'config' });


      logger.error(
        'Errors in config file:\n' +
        `- ${errors}`
      );
      process.exit(1);
    }

    if (loaded) {
      // Resolve paths relative to config file
      const base = path.dirname(loaded.filepath);
      config.plugins = config.plugins?.map((plugin) => path.resolve(base, plugin));

      // Apply on logger
      if (config.verbose) {
        ctx.container.get(Logger).level = config.verbose;
      }

      logger.verbose(`Loaded ${loaded.filepath} config file`);
    }

    return config;
  })
  .inSingletonScope();
