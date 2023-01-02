import { Argv } from 'yargs';

import { Awaitable } from '@/src/types';

// Types
export interface Plugin<T = unknown, U = T> {
  builder(yargs: Argv<T>): Awaitable<Argv<U>>;
}
