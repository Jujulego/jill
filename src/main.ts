import { Logger } from '@jujulego/logger';
import { hideBin } from 'yargs/helpers';

import '@/src/commons/logger.service.ts';
import { container } from '@/src/inversify.config.ts';
import { JillApplication } from '@/src/jill.application.ts';
import { ExitException } from '@/src/utils/exit.ts';

// Bootstrap
(async () => {
  const app = await container.getAsync(JillApplication);

  try {
    await app.run(hideBin(process.argv));
  } catch (err) {
    if (err instanceof ExitException) {
      process.exit(err.code);
    } else {
      console.error(await app.parser.getHelp());

      if (err.message) {
        const logger = container.get(Logger);
        logger.error(err.message);
      }

      process.exit(1);
    }
  }
})();
