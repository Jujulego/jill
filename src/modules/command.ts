import { decorate, injectable, type interfaces as int } from 'inversify';
import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs';

import { type Awaitable, type Class, type Type } from '@/src/types';

import { applyMiddlewares, type IMiddleware } from './middleware';
import { setRegistry } from '@/src/modules/module';

// Symbols
export const COMMAND: int.ServiceIdentifier<CommandModule> = Symbol('jujulego:jill:command');

// Types
export interface ICommand<A = unknown> {
  builder?: (parser: Argv) => Awaitable<Argv<A>>;
  handler(args: ArgumentsCamelCase<A>): Awaitable<void>;
}

export interface ICommandOpts {
  readonly command: string;
  readonly aliases?: string | readonly string[];
  readonly describe?: string;
  readonly deprecated?: boolean;
  readonly middlewares?: Type<IMiddleware>[];
}

// Decorator
export function Command(opts: ICommandOpts) {
  return (target: Class<ICommand>) => {
    decorate(injectable(), target);

    setRegistry(target, (bind) => {
      bind(target).toSelf();
      bind(COMMAND)
        .toDynamicValue(async ({ container }) => {
          const cmd = await container.getAsync(target);
          cmd.builder ??= (parser: Argv) => parser;

          return {
            command: opts.command,
            aliases: opts.aliases,
            describe: opts.describe,
            deprecated: opts.deprecated,

            builder: (parser: Argv) => cmd.builder(applyMiddlewares(parser, opts.middlewares ?? [])),
            handler: (...args) => cmd.handler(...args),
          };
        })
        .whenTargetNamed(opts.command.split(' ')[0]);
    });
  };
}
