import { FC, ReactElement } from 'react';

import { BuilderWrapper, Command, CommandComponent, useArgs, UseArgsHook } from './application.context';
import { CommandUtils } from './command';

// Types
export type CommandWrapper<A> = <Args>(utils: CommandUtils<Args>) => CommandUtils<Omit<Args, keyof A> & A>;
export type WrapperComponent<A> = <Args>(useArgs: UseArgsHook<A>, Wrapped: CommandComponent<Args>) => ReactElement;

// Wrapper generator
export function commandWrapper<A>(name: string, builder: BuilderWrapper<A>, wrapper: WrapperComponent<A>): CommandWrapper<A> {
  return <Args>(utils: CommandUtils<Args>): CommandUtils<Omit<Args, keyof A> & A> => ({
    useArgs: () => useArgs<Args & A>(),
    wrapper: (Component: FC): CommandComponent<Omit<Args, keyof A> & A> => {
      const Wrapped = utils.wrapper(Component);

      // Update builder
      const command: Command<Omit<Args, keyof A> & A> = {
        ...Wrapped.command,
        builder: (yargs) => builder(Wrapped.command.builder(yargs))
      };

      // Component wrapper
      const Wrapper: FC = () => wrapper(useArgs, Wrapped);

      Wrapper.displayName = `${name}(${Wrapped.displayName || Wrapped.name})`;

      return Object.assign(Wrapper, { command });
    },
  });
}
