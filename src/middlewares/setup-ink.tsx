import { render } from 'ink';

import { container, INK_APP } from '../services';
import { Layout } from '../ui';
import { defineMiddleware } from '../utils';

// Middleware
export const setupInk = defineMiddleware({
  handler() {
    container.bind(INK_APP)
      .toConstantValue(render(<Layout/>, {
        stdout: process.stdout.isTTY ? process.stdout : process.stderr,
      }));
  }
});
