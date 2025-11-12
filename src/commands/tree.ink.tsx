import { source$, waitFor$ } from 'kyrielle';
import type { Workspace } from '../projects/workspace.js';
import WorkspaceTree from '../components/WorkspaceTree.jsx';
import { inked } from '../wrappers/inked.jsx';

const TreeInk = inked(async function* (props: TreeInkProps) {
  const loaded$ = source$<void>();

  yield <WorkspaceTree workspace={props.workspace} onLoaded={loaded$.next} />;

  await waitFor$(loaded$);
});

export default TreeInk;

// Types
export interface TreeInkProps {
  readonly workspace: Workspace;
}
