import chalk from 'chalk';

import { container } from '@/src/inversify.config';
import { CONFIG } from '@/src/config/config-loader';
import '@/tools/matchers/setup';

// Chalk config
chalk.level = 0;

// Setup global config
container.rebind(CONFIG).toConstantValue({ jobs: 1 });
