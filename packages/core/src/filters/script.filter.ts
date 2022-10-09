import { Workspace } from '../project';

import { Filter } from './filter';

// Filter
export class ScriptFilter implements Filter {
  // Constructor
  constructor(readonly scripts: string[]) {}

  // Methods
  test(workspace: Workspace): boolean {
    const scripts = Object.keys(workspace.manifest.scripts || {});
    return this.scripts.some((scr) => scripts.includes(scr));
  }
}
