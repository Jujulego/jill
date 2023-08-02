import { type Workspace } from '@/src/project/workspace.ts';

import { type PipelineFilter } from './pipeline.ts';

// Filter
export class PrivateFilter implements PipelineFilter {
  // Constructor
  constructor(readonly value: boolean) {}

  // Methods
  test(workspace: Workspace): boolean {
    return (workspace.manifest.private ?? false) === this.value;
  }
}
