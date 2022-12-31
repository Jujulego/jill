import { render } from 'ink';

import { container, INK_APP } from '@/src/services/inversify.config';
import Layout from '@/src/ui/layout';
import { defineMiddleware } from '@/src/utils/yargs';

// Middleware
export const setupInk = defineMiddleware({
  handler() {
    container.bind(INK_APP)
      .toConstantValue(render(<Layout />, {
        stdout: process.stdout.isTTY ? process.stdout : process.stderr,
      }));
  }
});
