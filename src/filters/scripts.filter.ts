import { type Workspace } from '@/src/project/workspace.ts';

import { type PipelineFilter } from './pipeline.ts';

// Filter
export class ScriptsFilter implements PipelineFilter {
  // Constructor
  constructor(readonly scripts: string[], readonly all = false) {}

  // Methods
  test(workspace: Workspace): boolean {
    const scripts = Object.keys(workspace.manifest.scripts || {});

    if (this.all) {
      return this.scripts.every((scr) => scripts.includes(scr));
    } else {
      return this.scripts.some((scr) => scripts.includes(scr));
    }
  }
}
