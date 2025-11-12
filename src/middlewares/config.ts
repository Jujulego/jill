import { asyncScope$, inject$ } from '@kyrielle/injector';
import { startSpan } from '@sentry/node';
import type { Argv } from 'yargs';
import { ConfigService } from '../config/config.service.js';

/**
 * Adds configuration arguments and loading.
 */
export function withConfig<T>(parser: Argv<T>) {
  return parser
    .option('config-file', {
      alias: 'c',
      type: 'string',
      description: 'Configuration file'
    })
    .middleware((args) => startSpan({ name: 'config', op: 'cli.middleware' }, async () => {
      const configService = inject$(ConfigService, asyncScope$());

      if (args.configFile) {
        await configService.loadConfig(args.configFile);
      } else {
        await configService.searchConfig();
      }
    }));
}

// Types
export interface ConfigArgs {
  readonly 'config-file'?: string;
}
