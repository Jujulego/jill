import { decorate, injectable, type interfaces as int } from 'inversify';
import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs';

import { type Awaitable, type Class, type Type } from '@/src/types';

import { applyMiddlewares, type IMiddleware } from './middleware';
import { setRegistry } from '@/src/modules/module';

// Symbols
const COMMAND_OPTS = Symbol('jujulego:jill:command-opts');

export const COMMAND: int.ServiceIdentifier<[ICommand, ICommandOpts]> = Symbol('jujulego:jill:command');
export const COMMAND_MODULE: int.ServiceIdentifier<CommandModule> = Symbol('jujulego:jill:command-module');

// Types
export interface ICommand<A = unknown> {
  builder?: (parser: Argv) => Argv<A>;
  handler(args: ArgumentsCamelCase<A>): Awaitable<void>;
}

export interface ICommandOpts {
  readonly command: string;
  readonly aliases?: string | readonly string[];
  readonly describe?: string;
  readonly deprecated?: boolean;
  readonly middlewares?: Type<IMiddleware>[];
}

// Utils
export function getCommandOpts(target: Class<ICommand>): ICommandOpts {
  const opts = Reflect.getMetadata(COMMAND_OPTS, target);

  if (typeof opts !== 'object') {
    throw new Error(`No command options found in ${target.name}`);
  }

  return opts;
}

export function buildCommandModule(cmd: ICommand, opts: ICommandOpts): CommandModule {
  return {
    command: opts.command,
    aliases: opts.aliases,
    describe: opts.describe,
    deprecated: opts.deprecated,

    builder(parser: Argv) {
      if (opts.middlewares) {
        parser = applyMiddlewares(parser, opts.middlewares);
      }

      if (cmd.builder) {
        parser = cmd.builder(parser);
      }

      return parser;
    },
    handler: (args) => cmd.handler(args),
  };
}

// Decorator
export function Command(opts: ICommandOpts) {
  return (target: Class<ICommand>) => {
    decorate(injectable(), target);

    Reflect.defineMetadata(COMMAND_OPTS, opts, target);

    const cmd = opts.command.split(' ')[0];
    setRegistry(target, (bind) => {
      bind(target).toSelf();

      bind(COMMAND)
        .toDynamicValue(async ({ container }) => [await container.getAsync(target), opts])
        .whenTargetNamed(cmd);

      bind(COMMAND_MODULE)
        .toDynamicValue(async ({ container }) => {
          const cmd = await container.getAsync(target);
          return buildCommandModule(cmd, opts);
        })
        .whenTargetNamed(cmd);
    });
  };
}
