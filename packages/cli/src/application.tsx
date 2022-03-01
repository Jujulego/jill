import { logger } from '@jujulego/jill-core';
import { Children, FC, ReactElement, useEffect, useRef, useState } from 'react';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import {
  ApplicationContext,
  ApplicationContextState,
  applicationDefaultState,
  Args,
  GlobalArgs, isCommandElement
} from './application.context';

// Types
export interface ApplicationProps {
  name: string;
}

// Component
export const Application: FC<ApplicationProps> = ({ name, children }) => {
  // State
  const [state, setState] = useState<ApplicationContextState>(applicationDefaultState);

  // Refs
  const commands = useRef(new Map<string, ReactElement>());

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
    Children.forEach(children, (child) => {
      if (!isCommandElement(child)) {
        return;
      }

      const { command } = child.type;
      commands.current.set(command.id, child);
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
    });

    // Parse to run command
    parser.strictCommands()
      .help()
      .parse();
  })(), [name, children]);

  // Render
  if (!state.command) {
    return null;
  }

  return (
    <ApplicationContext.Provider value={state}>
      { Children.map(children, (child) => {
        if (isCommandElement(child)) {
          return child.type.command.id === state.command?.id ? child : null;
        }

        return child;
      }) }
    </ApplicationContext.Provider>
  );
};
