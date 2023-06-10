import { Command } from '@/src/modules/command';
import { InkCommand } from '@/src/modules/ink-command';
import { LoadProject } from '@/src/middlewares/load-project';
import { LazyCurrentWorkspace, LoadWorkspace } from '@/src/middlewares/load-workspace';
import { type Workspace } from '@/src/project/workspace';
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
  @LazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Methods
  *render() {
    yield <WorkspaceTree workspace={this.workspace} />;
  }
}
