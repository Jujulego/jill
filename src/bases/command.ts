import { decorate, injectable, interfaces as int } from 'inversify';
import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs';

import { container } from '@/src/inversify.config';
import { type Awaitable, type Type } from '@/src/types';

import { applyMiddlewares, type IMiddleware } from './middleware';

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
  return (target: Type<ICommand>) => {
    decorate(injectable(), target);

    container.bind(target).toSelf();
    container
      .bind(COMMAND)
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
  };
}
