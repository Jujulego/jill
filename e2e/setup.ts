import { CONFIG } from '@/src/config/config-loader';
import { container } from '@/src/inversify.config';

import '@/tools/matchers/setup';

// Setup global config
container.bind(CONFIG)
  .toConstantValue({ jobs: 1 });
