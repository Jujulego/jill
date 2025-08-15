import { ConfigService } from '../../config/config.service.js';
import { inject$ } from '@kyrielle/injector';
import type { Argv } from 'yargs';

// Middleware
export function configMiddleware<T>(parser: Argv<T>) {
  return parser
    .option('config-file', {
      alias: 'c',
      type: 'string',
      description: 'Configuration file'
    })
    .middleware(async (args) => {
      const configService = inject$(ConfigService);

      if (args.configFile) {
        await configService.loadConfig(args.configFile);
      } else {
        await configService.searchConfig();
      }
    });
}
