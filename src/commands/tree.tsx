import { loadProject } from '@/src/middlewares/load-project';
import { loadWorkspace } from '@/src/middlewares/load-workspace';
import { setupInk } from '@/src/middlewares/setup-ink';
import { Workspace } from '@/src/project/workspace';
import { container, CURRENT, INK_APP } from '@/src/services/inversify.config';
import Layout from '@/src/ui/layout';
import WorkspaceTree from '@/src/ui/workspace-tree';
import { applyMiddlewares, defineCommand } from '@/src/utils/yargs';

// Command
export default defineCommand({
  command: 'tree',
  describe: 'Print workspace dependency tree',
  builder: (yargs) =>
    applyMiddlewares(yargs, [
      setupInk,
      loadProject,
      loadWorkspace
    ]),
  handler: () => {
    const app = container.get(INK_APP);
    const workspace = container.getNamed(Workspace, CURRENT);

    app.rerender(
      <Layout>
        <WorkspaceTree workspace={workspace} />
      </Layout>
    );
  }
});
