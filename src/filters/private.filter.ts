import { filter$, type SimpleAsyncIterator } from 'kyrielle';
import { type Workspace as LegacyWorkspace } from '../project/workspace.js';
import { type Workspace } from '../projects/workspace.js';
import { type PipelineFilter } from './pipeline.js';

// Filter
/** @deprecated */
export class PrivateFilter implements PipelineFilter {
  // Constructor
  constructor(readonly value: boolean) {}

  // Methods
  test(workspace: LegacyWorkspace): boolean {
    return (workspace.manifest.private ?? false) === this.value;
  }
}

export function isPrivate$(value: boolean) {
  return filter$<SimpleAsyncIterator<Workspace>>((wks) => (wks.manifest.private ?? false) === value);
}