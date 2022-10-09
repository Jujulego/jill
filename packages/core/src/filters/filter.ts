import { Workspace } from '../project';
import { Awaitable } from '../types';

// Interface
export interface Filter {
  // Methods
  test(workspace: Workspace): Awaitable<boolean>;
}
