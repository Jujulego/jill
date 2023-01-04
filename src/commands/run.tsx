import { waitForEvent } from '@jujulego/event-tree';

import { loadProject } from '@/src/middlewares/load-project';
import { loadWorkspace } from '@/src/middlewares/load-workspace';
import { setupInk } from '@/src/middlewares/setup-ink';
import { Workspace } from '@/src/project/workspace';
import { container, CURRENT, INK_APP } from '@/src/inversify.config';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import Layout from '@/src/ui/layout';
import TaskManagerSpinner from '@/src/ui/task-manager-spinner';
import { applyMiddlewares, defineCommand } from '@/src/utils/yargs';

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
        default: 'all' as const,
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      }),
  async handler(args) {
    const app = container.get(INK_APP);
    const workspace = container.getNamed(Workspace, CURRENT);
    const manager = container.get(TASK_MANAGER);

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
