import { Argv } from 'yargs';

import { container, GLOBAL_CONFIG } from '../services';

// Middleware
export function globalConfig<T>(yargs: Argv<T>) {
  return yargs
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Set verbosity level',
    })
    .option('jobs', {
      alias: 'j',
      type: 'number',
      description: 'Set maximum parallel job number',
    })
    .middleware((config) => {
      container.bind(GLOBAL_CONFIG).toConstantValue(config);
    });
}
