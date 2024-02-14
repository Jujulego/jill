import { type Instance} from 'ink';
import { injectable } from 'inversify';
import { type ReactNode } from 'react';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { INK_APP } from '@/src/ink.config.tsx';
import { lazyInject } from '@/src/inversify.config.ts';
import { type AwaitableGenerator } from '@/src/types.ts';
import Layout from '@/src/ui/layout.tsx';

import { type ICommand } from './command.ts';

// Class
@injectable()
export abstract class InkCommand<A = unknown> implements ICommand<A> {
  // Lazy injections
  @lazyInject(INK_APP)
  readonly app: Instance;

  // Methods
  abstract render(args: ArgumentsCamelCase<A>): AwaitableGenerator<ReactNode>;

  builder(parser: Argv): Argv<A> {
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
  }
}
