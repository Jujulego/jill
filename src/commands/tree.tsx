import { Command } from '@/src/modules/command.ts';
import { InkCommand } from '@/src/modules/ink-command.tsx';
import { LoadProject } from '@/src/middlewares/load-project.ts';
import { LazyCurrentWorkspace, LoadWorkspace } from '@/src/middlewares/load-workspace.ts';
import { type Workspace } from '@/src/project/workspace.ts';
import WorkspaceTree from '@/src/ui/workspace-tree.tsx';

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
