import '@/tools/matchers/setup';
import { rootScope$, runIn$, scope$ } from '@kyrielle/injector';
import { aroundAll, aroundEach, vi } from 'vitest';

vi.hoisted(() => vi.resetModules());

// eslint-disable-next-line no-empty-pattern
aroundAll((runSuite, {}, suite) => {
  if ('filepath' in suite) {
    return runIn$(rootScope$(`[[suite:${suite.name}]]`), runSuite);
  } else {
    return runIn$(scope$(`[[suite:${suite.name}]]`), runSuite);
  }
});
// eslint-disable-next-line no-empty-pattern
aroundEach((runTest, {}, suite) => {
  return runIn$(scope$(`[[test:${suite.name}]]`), runTest);
});
