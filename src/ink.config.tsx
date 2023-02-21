import type ink from 'ink';
import { render } from 'ink';
import { type interfaces as int } from 'inversify';

import { container } from '@/src/inversify.config';
import Layout from '@/src/ui/layout';

// Constants
export const INK_APP: int.ServiceIdentifier<ink.Instance> = Symbol.for('jujulego:jill:ink-app');

// Setup
container
  .bind(INK_APP)
  .toDynamicValue(() => {
    return render(
      <Layout />,
      {
        stdout: process.stdout.isTTY ? process.stdout : process.stderr,
      }
    );
  })
  .inSingletonScope();
