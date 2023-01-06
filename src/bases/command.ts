import { decorate, injectable, interfaces as int } from 'inversify';
import { ArgumentsCamelCase, Argv } from 'yargs';

import { container } from '@/src/inversify.config';
import { Awaitable, Type } from '@/src/types';

// Types
export interface ICommand<A = unknown> {
  // Attributes
  readonly command: string;
  readonly aliases?: string | readonly string[];
  readonly describe?: string;
  readonly deprecated?: boolean;

  // Methods
  builder?: (yargs: Argv) => Awaitable<Argv<A>>;
  handler(args: ArgumentsCamelCase<A>): Awaitable<void>;
}

// Symbols
export const COMMAND: int.ServiceIdentifier<ICommand> = Symbol('jujulego:jill:command');

// Decorator
export function Command() {
  return (target: Type<ICommand>) => {
    decorate(injectable(), target);

    container.bind(target).toSelf();
    container.bind(COMMAND).toDynamicValue(async ({ container }) => {
      const cmd = await container.getAsync(target);

      return {
        ...cmd,
        builder: cmd.builder && ((...args) => cmd.builder(...args)),
        handler: (...args) => cmd.handler(...args),
      };
    });
  };
}
