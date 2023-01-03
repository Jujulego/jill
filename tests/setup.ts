import chalk from 'chalk';

import { container, SERVICES_CONFIG } from '@/src/services/inversify.config';
import { CONFIG } from '@/src/services/config/loader';
import '@/tools/matchers/setup';

// Chalk config
chalk.level = 0;

// Setup global config
container.bind(SERVICES_CONFIG).toConstantValue({ jobs: 1 });
container.rebind(CONFIG).toConstantValue({});
