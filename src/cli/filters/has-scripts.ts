import { filter$, type SimpleAsyncIterator } from 'kyrielle';
import { type Workspace } from '../../projects/workspace.js';

// Filter
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
