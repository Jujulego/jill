import { waitForEvent } from '@jujulego/event-tree';
import { TaskManager } from '@jujulego/tasks';

import { loadProject, loadWorkspace, setupInk } from '../middlewares';
import { Workspace, WorkspaceDepsMode } from '../project';
import { container, CURRENT, INK_APP } from '../services';
import { Layout, TaskManagerSpinner } from '../ui';
import { applyMiddlewares, defineCommand } from '../utils';

// Command
export default defineCommand({
  command: 'run <script>',
  describe: 'Run script inside workspace',
  builder: async (yargs) =>
    (await applyMiddlewares(yargs, [
      setupInk,
      loadProject,
      loadWorkspace
    ]))
      .positional('script', { type: 'string', demandOption: true })
      .option('deps-mode', {
        choice: ['all', 'prod', 'none'],
        default: 'all' as WorkspaceDepsMode,
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      }),
  async handler(args) {
    const app = container.get(INK_APP);
    const workspace = container.getNamed(Workspace, CURRENT);
    const manager = container.get(TaskManager);

    // Extract arguments
    const rest = args._.map(arg => arg.toString());

    if (rest[0] === 'run') {
      rest.splice(0, 1);
    }

    // Run script in workspace
    const task = await workspace.run(args.script, rest, {
      buildDeps: args.depsMode,
    });
    manager.add(task);

    // Render
    app.rerender(
      <Layout>
        <TaskManagerSpinner manager={manager} />
      </Layout>
    );

    // Wait for result
    const result = await waitForEvent(task, 'completed');

    if (result.status === 'failed') {
      return process.exit(1);
    }
  }
});
