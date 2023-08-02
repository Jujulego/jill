import yargs, { type Argv } from 'yargs';
import { type interfaces as int } from 'inversify';
import { hideBin } from 'yargs/helpers';

import { container } from '@/src/inversify.config.ts';

import { type IConfig } from './types.ts';

// Symbols
export const CONFIG_OPTIONS: int.ServiceIdentifier<IConfig> = Symbol('jujulego:jill:config-options');

// Constants
const VERBOSITY_LEVEL: Record<number, IConfig['verbose']> = {
  1: 'verbose',
  2: 'debug',
};

// Options
export function applyConfigOptions(parser: Argv): Argv<Omit<IConfig, 'plugins'>> {
  return parser
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Set verbosity level',
      coerce: (cnt) => VERBOSITY_LEVEL[Math.min(cnt, 2)]
    })
    .option('jobs', {
      alias: 'j',
      type: 'number',
      description: 'Set maximum parallel job number',
    });
}

container
  .bind(CONFIG_OPTIONS)
  .toDynamicValue(() => {
    const parser = yargs(hideBin(process.argv))
      .help(false)
      .version(false);

    applyConfigOptions(parser);

    return parser.parse();
  })
  .inSingletonScope();
