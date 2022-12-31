import { Workspace } from '@/src/project/workspace';

import { PipelineFilter } from './pipeline';

// Filter
export class ScriptsFilter implements PipelineFilter {
  // Constructor
  constructor(readonly scripts: string[]) {}

  // Methods
  test(workspace: Workspace): boolean {
    const scripts = Object.keys(workspace.manifest.scripts || {});
    return this.scripts.some((scr) => scripts.includes(scr));
  }
}
