import ink from 'ink';
import { inject, injectable } from 'inversify';
import { type ReactNode } from 'react';
import { ArgumentsCamelCase, type Argv } from 'yargs';

import { INK_APP } from '@/src/ink.config';
import { type Awaitable } from '@/src/types';
import Layout from '@/src/ui/layout';

import { type ICommand } from './command';

// Class
@injectable()
export abstract class InkCommand<A = unknown> implements ICommand<A> {
  // Lazy injections
  @inject(INK_APP)
  readonly app: ink.Instance;

  // Methods
  abstract render(args: ArgumentsCamelCase<A>): ReactNode;

  builder(yargs: Argv): Awaitable<Argv<A>> {
    return yargs as Argv<A>;
  }

  handler(args: ArgumentsCamelCase<A>): Promise<void> {
    this.app.rerender(
      <Layout>
        { this.render(args) }
      </Layout>
    );

    return this.app.waitUntilExit();
  }
}
