import { Argv } from 'yargs';

import { Command } from '@/src/bases/command';
import { InkCommand } from '@/src/bases/ink-command';
import { loadProject } from '@/src/middlewares/load-project';
import { loadWorkspace } from '@/src/middlewares/load-workspace';
import { lazyCurrentWorkspace, Workspace } from '@/src/project/workspace';
import WorkspaceTree from '@/src/ui/workspace-tree';
import { applyMiddlewares } from '@/src/utils/yargs';

// Command
@Command({
  command: 'tree',
  describe: 'Print workspace dependency tree'
})
export class TreeCommand extends InkCommand {
  // Lazy injections
  @lazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Methods
  builder(yargs: Argv) {
    return applyMiddlewares(yargs, [
      loadProject,
      loadWorkspace
    ]);
  }

  render() {
    return (
      <WorkspaceTree workspace={this.workspace} />
    );
  }
}
