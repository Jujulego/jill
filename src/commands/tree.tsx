import { Command } from '@/src/bases/command';
import { InkCommand } from '@/src/bases/ink-command';
import { LoadProject } from '@/src/middlewares/load-project';
import { LoadWorkspace } from '@/src/middlewares/load-workspace';
import { lazyCurrentWorkspace, Workspace } from '@/src/project/workspace';
import WorkspaceTree from '@/src/ui/workspace-tree';

// Command
@Command({
  command: 'tree',
  describe: 'Print workspace dependency tree',
  middlewares: [
    LoadProject,
    LoadWorkspace
  ]
})
export class TreeCommand extends InkCommand {
  // Lazy injections
  @lazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Methods
  *render() {
    yield <WorkspaceTree workspace={this.workspace} />;
  }
}
