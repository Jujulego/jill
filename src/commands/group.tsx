import { waitForEvent } from '@jujulego/event-tree';

import { loadProject } from '@/src/middlewares/load-project';
import { loadWorkspace } from '@/src/middlewares/load-workspace';
import { setupInk } from '@/src/middlewares/setup-ink';
import { Workspace, WorkspaceDepsMode } from '@/src/project/workspace';
import { container, CURRENT, INK_APP } from '@/src/inversify.config';
import { TaskExprService } from '@/src/tasks/task-expr.service';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import Layout from '@/src/ui/layout';
import TaskManagerSpinner from '@/src/ui/task-manager-spinner';
import { applyMiddlewares, defineCommand } from '@/src/utils/yargs';

// Command
export default defineCommand({
  command: 'group <script..>',
  describe: 'Run many scripts inside a workspace (experimental)',
  builder: async (yargs) =>
    (await applyMiddlewares(yargs, [
      setupInk,
      loadProject,
      loadWorkspace
    ]))
      .positional('script', {
        demandOption: true,
        coerce(expr: string[]) {
          const parser = container.get(TaskExprService);
          return parser.parse(expr.join(' ')).roots[0];
        }
      })
      .option('deps-mode', {
        choices: ['all', 'prod', 'none'] as const,
        default: 'all' as WorkspaceDepsMode,
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      }),
  async handler(args) {
    const app = container.get(INK_APP);
    const workspace = container.getNamed(Workspace, CURRENT);
    const manager = container.get(TASK_MANAGER);
    const parser = container.get(TaskExprService);

    // Run script in workspace
    const group = await parser.buildTask(args.script, workspace, {
      buildDeps: args.depsMode,
    });

    manager.add(group);

    // Render
    app.rerender(
      <Layout>
        <TaskManagerSpinner manager={manager} />
      </Layout>
    );

    // Wait for result
    const result = await waitForEvent(group, 'completed');

    if (result.status === 'failed') {
      return process.exit(1);
    }
  }
});
