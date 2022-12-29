import { loadProject, loadWorkspace, setupInk } from '../middlewares';
import { Workspace } from '../project';
import { container, CURRENT, INK_APP } from '../services';
import { Layout, WorkspaceTree } from '../ui';
import { applyMiddlewares, defineCommand } from '../utils';

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
