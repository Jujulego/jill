import { loadProject, loadWorkspace, setupInk } from '../middlewares';
import { container, CURRENT } from '../services';
import { applyMiddlewares, defineCommand } from '../utils';
import { Workspace } from '../project';

// Command
export default defineCommand({
  command: 'infos',
  describe: 'Describe a workspace',
  builder: (yargs) =>
    applyMiddlewares(yargs, [
      setupInk,
      loadProject,
      loadWorkspace
    ]),
  handler: () => {
    const workspace = container.getNamed(Workspace, CURRENT);

    console.log(workspace.name);
  }
});
