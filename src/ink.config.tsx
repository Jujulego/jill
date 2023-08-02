import { type Instance } from 'ink';
import { render } from 'ink';
import { type interfaces as int } from 'inversify';
import wt from 'node:worker_threads';

import { container } from '@/src/inversify.config.ts';
import Layout from '@/src/ui/layout.tsx';

// Constants
export const INK_APP: int.ServiceIdentifier<Instance> = Symbol.for('jujulego:jill:ink-app');

// Setup
container
  .bind(INK_APP)
  .toDynamicValue(() => {
    if (!wt.isMainThread) {
      throw new Error('Ink should only be used in main thread');
    }

    return render(
      <Layout />,
      {
        stdout: process.stdout.isTTY ? process.stdout : process.stderr,
      }
    );
  })
  .inSingletonScope();
