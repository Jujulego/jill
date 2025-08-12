import { filter$, type SimpleAsyncIterator } from 'kyrielle';
import { type Workspace as LegacyWorkspace } from '../project/workspace.js';
import { type Workspace } from '../projects/workspace.js';
import { type PipelineFilter } from './pipeline.js';

// Filter
/** @deprecated */
export class ScriptsFilter implements PipelineFilter {
  // Constructor
  constructor(readonly scripts: string[], readonly all = false) {}

  // Methods
  test(workspace: LegacyWorkspace): boolean {
    const scripts = Object.keys(workspace.manifest.scripts || {});

    if (this.all) {
      return this.scripts.every((scr) => scripts.includes(scr));
    } else {
      return this.scripts.some((scr) => scripts.includes(scr));
    }
  }
}

export function hasSomeScript$(scripts: readonly string[]) {
  return filter$<SimpleAsyncIterator<Workspace>>((wks) => {
    if (!wks.manifest.scripts) {
      return false;
    }

    return scripts.some((script) => script in wks.manifest.scripts!);
  });
}

export function hasEveryScript$(scripts: readonly string[]) {
  return filter$<SimpleAsyncIterator<Workspace>>((wks) => {
    if (!wks.manifest.scripts) {
      return false;
    }

    return scripts.every((script) => script in wks.manifest.scripts!);
  });
}
