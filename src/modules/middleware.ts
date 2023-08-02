import { decorate, injectable } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { container } from '@/src/inversify.config.ts';
import { type Awaitable, type Type } from '@/src/types.ts';

// Types
export interface IMiddleware<A = unknown> {
  builder?: (parser: Argv) => Argv<A>;
  handler(args: ArgumentsCamelCase<A>): Awaitable<void>;
}

// Decorator
export function Middleware() {
  return (target: Type<IMiddleware>) => {
    decorate(injectable(), target);
    container.bind(target).toSelf().inSingletonScope();
  };
}

// Utils
export function applyMiddlewares(parser: Argv, middlewares: Type<IMiddleware>[]): Argv {
  let tmp = parser;

  for (const cls of middlewares) {
    const middleware = container.get(cls);

    if (middleware.builder) {
      tmp = middleware.builder(tmp);
    }

    tmp.middleware((args) => middleware.handler(args));
  }

  return tmp;
}
