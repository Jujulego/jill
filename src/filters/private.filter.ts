import { type Workspace } from '@/src/project/workspace.js';

import { type PipelineFilter } from './pipeline.js';

// Filter
export class PrivateFilter implements PipelineFilter {
  // Constructor
  constructor(readonly value: boolean) {}

  // Methods
  test(workspace: Workspace): boolean {
    return (workspace.manifest.private ?? false) === this.value;
  }
}
