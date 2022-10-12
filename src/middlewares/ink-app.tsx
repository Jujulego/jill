import { Argv } from 'yargs';

import { container, INK_APP } from '../services';
import { Layout } from '../ui';
import { render } from 'ink';

// Middleware
export function inkApp<T>(yargs: Argv<T>) {
  return yargs.middleware(async () => {
    container.bind(INK_APP)
      .toConstantValue(render(<Layout />));
  });
}
