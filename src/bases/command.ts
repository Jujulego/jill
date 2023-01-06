import { decorate, injectable, interfaces as int } from 'inversify';
import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';

import { container } from '@/src/inversify.config';
import { Awaitable, Type } from '@/src/types';

// Symbols
export const COMMAND: int.ServiceIdentifier<CommandModule> = Symbol('jujulego:jill:command');

// Types
export interface ICommand<A = unknown> {
  builder?: (yargs: Argv) => Awaitable<Argv<A>>;
  handler(args: ArgumentsCamelCase<A>): Awaitable<void>;
}

export interface ICommandOpts {
  readonly command: string;
  readonly aliases?: string | readonly string[];
  readonly describe?: string;
  readonly deprecated?: boolean;
}

// Decorator
export function Command(opts: ICommandOpts) {
  return (target: Type<ICommand>) => {
    decorate(injectable(), target);

    container.bind(target).toSelf();
    container
      .bind(COMMAND)
      .toDynamicValue(async ({ container }) => {
        const cmd = await container.getAsync(target);

        return {
          command: opts.command,
          aliases: opts.aliases,
          describe: opts.describe,
          deprecated: opts.deprecated,

          builder: cmd.builder && ((...args) => cmd.builder(...args)),
          handler: (...args) => cmd.handler(...args),
        };
      })
      .whenTargetNamed(opts.command);
  };
}
