import os from 'node:os';

import { container, GLOBAL_CONFIG } from '../services';
import { defineMiddleware } from '../utils';

// Middleware
export const globalConfig = defineMiddleware({
  builder: (yargs) => yargs
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Set verbosity level',
    })
    .option('jobs', {
      alias: 'j',
      type: 'number',
      default: os.cpus().length - 1,
      description: 'Set maximum parallel job number',
    }),
  handler(args) {
    container.bind(GLOBAL_CONFIG).toConstantValue({
      verbose: args.verbose,
      jobs: args.jobs,
    });
  }
});
