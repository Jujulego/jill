import { decorate, injectable } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { container } from '@/src/inversify.config';
import { type Awaitable, Type } from '@/src/types';

// Types
export interface IMiddleware<A = unknown> {
  builder?: (yargs: Argv) => Awaitable<Argv<A>>;
  handler(args: ArgumentsCamelCase<A>): Awaitable<void>;
}

// Decorator
export function Middleware() {
  return (target: Type<IMiddleware>) => {
    decorate(injectable(), target);
  };
}

// Utils
export async function applyMiddlewares(yargs: Argv, middlewares: Type<IMiddleware>[]): Promise<Argv> {
  let tmp: Argv<unknown> = yargs;

  for (const cls of middlewares) {
    const middleware = container.resolve(cls);

    if (middleware.builder) {
      tmp = await middleware.builder(tmp);
    }

    tmp.middleware((yargs) => middleware.handler(yargs));
  }

  return tmp;
}
