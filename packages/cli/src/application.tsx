import { Children, createContext, FC, isValidElement, ReactElement, useEffect, useState } from 'react';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { CommandComponent } from './command.hoc';

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

// Context
export const ArgsContext = createContext<Record<string, unknown>>({});

// Component
export const Application: FC<ApplicationProps> = ({ name, children }) => {
  // State
  const [args, setArgs] = useState<Record<string, unknown>>({});
  const [command, setCommand] = useState<string>();

  // Effects
  useEffect(() => {
    parser.scriptName(name);

    // Define commands
    Children.map(children, (child) => {
      if (!isValidElement(child)) {
        return;
      }

      const { command } = child.type as CommandComponent<unknown>;
      commands.set(command.id, child);
      parser.command(
        command.name,
        command.description,
        (y) => command.define(y),
        (a) => {
          setArgs(a);
          setCommand(command.id);
        }
      );
    });

    // Parse to run command
    parser.strictCommands()
      .help()
      .parse();
  }, [name, children]);

  // Render
  if (!command) {
    return null;
  }

  return (
    <ArgsContext.Provider value={args}>
      { commands.get(command) }
    </ArgsContext.Provider>
  );
};
