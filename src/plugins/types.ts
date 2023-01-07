import { Argv } from 'yargs';

import { Awaitable } from '@/src/types';

// Types
export interface Plugin<T = unknown, U = T> {
  builder(parser: Argv<T>): Awaitable<Argv<U>>;
}
