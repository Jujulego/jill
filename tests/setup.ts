import chalk from 'chalk';

import { container, SERVICES_CONFIG } from '@/src/inversify.config';
import { CONFIG } from '@/src/config/loader';
import '@/tools/matchers/setup';

// Chalk config
chalk.level = 0;

// Setup global config
container.bind(SERVICES_CONFIG).toConstantValue({ jobs: 1 });
container.rebind(CONFIG).toConstantValue({});
