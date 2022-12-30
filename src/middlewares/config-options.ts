import os from 'node:os';

import { CONFIG, container, Logger, SERVICES_CONFIG } from '../services';
import { defineMiddleware } from '../utils';

// Constants
const VERBOSITY_LEVEL: Record<number, string> = {
  1: 'verbose',
  2: 'debug',
};

// Middleware
export const configOptions = defineMiddleware({
  builder: async (yargs) => yargs
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Set verbosity level',
    })
    .option('jobs', {
      alias: 'j',
      type: 'number',
      default: (await container.getAsync(CONFIG)).jobs ?? (os.cpus().length - 1),
      description: 'Set maximum parallel job number',
    }),
  handler(args) {
    if (args.verbose) {
      const logger = container.get(Logger);
      logger.level = VERBOSITY_LEVEL[Math.min(args.verbose, 2)];
    }

    container.bind(SERVICES_CONFIG).toConstantValue({
      jobs: args.jobs,
    });
  }
});
