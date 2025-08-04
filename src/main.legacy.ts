import { Logger } from '@jujulego/logger';
import { hideBin } from 'yargs/helpers';

import '@/src/commons/logger.service.js';
import { container } from '@/src/inversify.config.js';
import { JillApplication } from '@/src/jill.application.js';
import { ExitException } from '@/src/utils/exit.js';

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
