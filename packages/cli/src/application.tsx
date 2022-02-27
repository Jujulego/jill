import { Children, FC, isValidElement, ReactElement, useEffect, useState } from 'react';
import Spinner from 'ink-spinner';
import { Text } from 'ink';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { CommandComponent } from './command.hoc';
import { ApplicationContext, ApplicationContextState, applicationDefaultState, Args } from './application.context';

// Types
export interface ApplicationProps {
  name: string;
}

// Constants
const parser = yargs(hideBin(process.argv))
  .parserConfiguration({
    'populate--': true,
  });

const commands = new Map<string, ReactElement>();

// Component
export const Application: FC<ApplicationProps> = ({ name, children }) => {
  // State
  const [state, setState] = useState<ApplicationContextState>(applicationDefaultState);

  // Effects
  useEffect(() => {
    // Config yargs
    parser.scriptName(name);

    // Define commands
    Children.map(children, (child) => {
      if (!isValidElement(child)) {
        return;
      }

      const { command } = child.type as CommandComponent<unknown, unknown>;
      commands.set(command.id, child);
      parser.command(
        command.name,
        command.description,
        (y) => command.builder(y),
        (args) => {
          setState((old) => ({
            ...old,
            args: args as Args<unknown>,
            command
          }));
        }
      );
    });

    // Parse to run command
    parser.strictCommands()
      .help()
      .parse();
  }, [name, children]);

  // Render
  if (!state.command) {
    return (
      <Text>
        <Spinner />
        {' '} Loading { name } ...
      </Text>
    );
  }

  return (
    <ApplicationContext.Provider value={state}>
      { commands.get(state.command.id) }
    </ApplicationContext.Provider>
  );
};
