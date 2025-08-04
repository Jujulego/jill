import { ConfigService } from '../../config/config.service.js';
import { inject$ } from '@kyrielle/injector';
import type { Argv } from 'yargs';

// Middleware
export function configMiddleware(parser: Argv) {
  return parser
    .option('config-file', {
      alias: 'c',
      type: 'string',
      description: 'Configuration file'
    })
    .middleware(async (args) => {
      const config = inject$(ConfigService);

      if (args.configFile) {
        await config.loadConfig(args.configFile);
      } else {
        await config.searchConfig();
      }
    });
}
