import { render } from 'ink';
import { Argv } from 'yargs';

import { container, INK_APP } from '../services';
import { Layout } from '../ui';

// Middleware
export function setupInk<T>(yargs: Argv<T>) {
  return yargs.middleware(async () => {
    container.bind(INK_APP)
      .toConstantValue(render(<Layout/>, {
        stdout: process.stdout.isTTY ? process.stdout : process.stderr,
      }));
  });
}
