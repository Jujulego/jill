import { container, SERVICES_CONFIG, ServicesConfig } from '@/src/inversify.config';
import '@/tools/matchers/setup';

// Setup global config
container.bind<ServicesConfig>(SERVICES_CONFIG)
  .toConstantValue({ jobs: 1 });
