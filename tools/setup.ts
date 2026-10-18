import '@/tools/matchers/setup';
import { rootScope$, runIn$, scope$ } from '@kyrielle/injector';
import { aroundAll, aroundEach, vi } from 'vitest';

vi.hoisted(() => vi.resetModules());

aroundAll((runSuite) => runIn$(rootScope$('suite'), runSuite));
aroundEach((runTest) => runIn$(scope$('test'), runTest));
