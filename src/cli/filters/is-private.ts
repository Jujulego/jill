import { filter$, type SimpleAsyncIterator } from 'kyrielle';
import { type Workspace } from '../../projects/workspace.js';

// Filter
export function isPrivate$(value: boolean) {
  return filter$<SimpleAsyncIterator<Workspace>>((wks) => (wks.manifest.private ?? false) === value);
}