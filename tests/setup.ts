import { container } from '@/src/inversify.config';
import { CONFIG } from '@/src/config/config-loader';
import '@/tools/matchers/setup';

// Setup global config
container.rebind(CONFIG).toConstantValue({ jobs: 1 });
