import { container, SERVICES_CONFIG, ServicesConfig } from '@/src/services/inversify.config';
import '@/tools/matchers/setup';

// Setup global config
container.bind<ServicesConfig>(SERVICES_CONFIG)
  .toConstantValue({ verbose: 0, jobs: 1 });
