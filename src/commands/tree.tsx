import ink from 'ink';
import { inject } from 'inversify';
import { Argv } from 'yargs';

import { Command, ICommand } from '@/src/bases/command';
import { INK_APP } from '@/src/ink.config';
import { loadProject } from '@/src/middlewares/load-project';
import { loadWorkspace } from '@/src/middlewares/load-workspace';
import { lazyCurrentWorkspace, Workspace } from '@/src/project/workspace';
import Layout from '@/src/ui/layout';
import WorkspaceTree from '@/src/ui/workspace-tree';
import { applyMiddlewares } from '@/src/utils/yargs';

// Command
@Command({
  command: 'tree',
  describe: 'Print workspace dependency tree'
})
export class TreeCommand implements ICommand {
  // Lazy injections
  @lazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Constructor
  constructor(
    @inject(INK_APP) private readonly app: ink.Instance
  ) {}

  // Methods
  builder(yargs: Argv) {
    return applyMiddlewares(yargs, [
      loadProject,
      loadWorkspace
    ]);
  }

  handler(): void {
    this.app.rerender(
      <Layout>
        <WorkspaceTree workspace={this.workspace} />
      </Layout>
    );
  }
}
