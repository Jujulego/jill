import { logger } from '@jujulego/jill-core';
import { FC, useEffect, useMemo, useState } from 'react';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import {
  ApplicationContext,
  ApplicationContextState,
  applicationDefaultState,
  Args, CommandComponent,
  GlobalArgs
} from './application.context';

// Types
export interface ApplicationProps {
  name: string;
  commands: CommandComponent<unknown>[]
}

// Component
export const Application: FC<ApplicationProps> = ({ name, commands }) => {
  // State
  const [state, setState] = useState<ApplicationContextState>(applicationDefaultState);

  // Memo
  const Command = useMemo(() => {
    return commands.find((cmd) => cmd.command.id === state.command?.id);
  }, [commands, state.command?.id]);

  // Effects
  useEffect(() => void (async () => {
    // Config yargs
    const parser = yargs(hideBin(process.argv))
      .parserConfiguration({
        'populate--': true,
      })
      .scriptName(name)
      .pkgConf(name)
      .option('plugins', {
        type: 'array',
        default: [] as string[],
        description: 'Plugins to load',
      })
      .option('verbose', {
        alias: 'v',
        type: 'count',
        description: 'Set verbosity level (1 for verbose, 2 for debug)',
      });

    // Parse global options
    const { verbose, plugins } = await parser.help(false).parse();

    // Setup logger verbosity
    if (verbose === 1) {
      logger.level = 'verbose';
    } else if (verbose >= 2) {
      logger.level = 'debug';
    }

    // Define core commands
    for (const { command } of commands) {
      parser.command(
        command.name,
        command.description,
        (y) => command.builder(y),
        (args) => {
          setState((old) => ({
            ...old,
            args: args as Args<GlobalArgs>,
            command
          }));
        }
      );
    }

    // Parse to run command
    parser.strictCommands()
      .help()
      .parse();
  })(), [name, commands]);

  // Render
  if (!Command) {
    return null;
  }

  return (
    <ApplicationContext.Provider value={state}>
      <Command />
    </ApplicationContext.Provider>
  );
};
