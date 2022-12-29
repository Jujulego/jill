import os from 'node:os';

import { CONFIG, container, SERVICES_CONFIG } from '../services';
import { defineMiddleware } from '../utils';

// Middleware
export const configOptions = defineMiddleware({
  builder: async (yargs) => yargs
    .option('verbose', {
      alias: 'v',
      type: 'count',
      default: (await container.getAsync(CONFIG)).verbose ?? 0,
      description: 'Set verbosity level',
    })
    .option('jobs', {
      alias: 'j',
      type: 'number',
      default: (await container.getAsync(CONFIG)).jobs ?? (os.cpus().length - 1),
      description: 'Set maximum parallel job number',
    }),
  handler(args) {
    container.bind(SERVICES_CONFIG).toConstantValue({
      verbose: args.verbose,
      jobs: args.jobs,
    });
  }
});
