import { inject$ } from '@kyrielle/injector';
import type { Argv } from 'yargs';
import { CliConfigService } from '../cli-tokens.js';

// Middleware
export function configMiddleware(parser: Argv) {
  return parser
    .option('config-file', {
      alias: 'c',
      type: 'string',
      description: 'Configuration file'
    })
    .middleware(async (args) => {
      const config = inject$(CliConfigService);

      if (args.configFile) {
        await config.loadConfig(args.configFile);
      } else {
        await config.searchConfig();
      }
    });
}
