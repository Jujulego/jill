import '@/src/commons/logger.service.ts';
import { CONFIG } from '@/src/config/config-loader.js';
import { container } from '@/src/inversify.config.js';

import '@/tools/matchers/setup';

// Setup global config
container.rebind(CONFIG).toConstantValue({ jobs: 1 });
