import { Workspace } from '../project';

import { PipelineFilter } from './pipeline';

// Filter
export class PrivateFilter implements PipelineFilter {
  // Constructor
  constructor(readonly value: boolean) {}

  // Methods
  test(workspace: Workspace): boolean {
    return (workspace.manifest.private ?? false) === this.value;
  }
}
