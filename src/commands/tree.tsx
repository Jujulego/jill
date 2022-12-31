import { loadProject, loadWorkspace, setupInk } from '@/src/middlewares';
import { Workspace } from '@/src/project';
import { container, CURRENT, INK_APP } from '@/src/services/inversify.config';
import { Layout, WorkspaceTree } from '@/src/ui';
import { applyMiddlewares, defineCommand } from '@/src/utils';

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
