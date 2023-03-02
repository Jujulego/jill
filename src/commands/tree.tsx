import { Command } from '@/src/modules/command.js';
import { InkCommand } from '@/src/modules/ink-command.jsx';
import { LoadProject } from '@/src/middlewares/load-project.js';
import { LoadWorkspace } from '@/src/middlewares/load-workspace.js';
import { LazyCurrentWorkspace, type Workspace } from '@/src/project/workspace.js';
import WorkspaceTree from '@/src/ui/workspace-tree.jsx';

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
