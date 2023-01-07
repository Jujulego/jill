import ink from 'ink';
import { inject, injectable } from 'inversify';
import { type ReactNode } from 'react';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { INK_APP } from '@/src/ink.config';
import { type Awaitable, type AwaitableGenerator } from '@/src/types';
import Layout from '@/src/ui/layout';

import { type ICommand } from './command';

// Class
@injectable()
export abstract class InkCommand<A = unknown> implements ICommand<A> {
  // Lazy injections
  @inject(INK_APP)
  readonly app: ink.Instance;

  // Methods
  abstract render(args: ArgumentsCamelCase<A>): AwaitableGenerator<ReactNode>;

  builder(parser: Argv): Awaitable<Argv<A>> {
    return parser as Argv<A>;
  }

  async handler(args: ArgumentsCamelCase<A>): Promise<void> {
    for await (const children of this.render(args)) {
      this.app.rerender(
        <Layout>
          { children }
        </Layout>
      );
    }

    return this.app.waitUntilExit();
  }
}
