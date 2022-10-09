import { Workspace } from '../project';

import { Filter } from './filter';

// Filter
export class PrivateFilter implements Filter {
  // Constructor
  constructor(readonly value: boolean) {}

  // Methods
  test(workspace: Workspace): boolean {
    return (workspace.manifest.private ?? false) === this.value;
  }
}
