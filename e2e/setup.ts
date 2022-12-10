import { container, GLOBAL_CONFIG, GlobalConfig } from '@/src/services/inversify.config';
import '@/tools/matchers';

// Setup global config
container.bind<GlobalConfig>(GLOBAL_CONFIG)
  .toConstantValue({ verbose: 0, jobs: 1 });
