import { TaskManager } from '@jujulego/tasks';
import ink from 'ink';

import { loadProject, loadWorkspace, setupInk } from '../middlewares';
import { Workspace, WorkspaceDepsMode } from '../project';
import { container, CURRENT, INK_APP } from '../services';
import { Layout, TasksSpinner } from '../ui';
import { applyMiddlewares, defineCommand } from '../utils';

// Command
export default defineCommand({
  command: 'run <script>',
  describe: 'Run script inside workspace',
  builder: (yargs) =>
    applyMiddlewares(yargs, [
      setupInk,
      loadProject,
      loadWorkspace
    ])
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
    const app = container.get<ink.Instance>(INK_APP);
    const workspace = container.getNamed(Workspace, CURRENT);
    const manager = container.get(TaskManager);

    // Extract arguments
    const rest = args._.map(arg => arg.toString());

    if (rest[0] === 'run') {
      rest.splice(0, 1);
    }

    // Run build task
    const task = await workspace.run(args.script, rest, {
      buildDeps: args.depsMode,
    });
    manager.add(task);

    // Render
    app.rerender(
      <Layout>
        <TasksSpinner manager={manager} />
      </Layout>
    );
  }
});
