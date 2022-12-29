import { waitForEvent } from '@jujulego/event-tree';
import { TaskManager } from '@jujulego/tasks';
import yargs from 'yargs';

import { loadProject, loadWorkspace, setupInk } from '../middlewares';
import { Workspace, WorkspaceDepsMode } from '../project';
import { container, CURRENT, INK_APP, TaskExprService } from '../services';
import { Layout, TaskManagerSpinner } from '../ui';
import { applyMiddlewares, defineCommand } from '../utils';

// Command
export default defineCommand({
  command: 'group <script..>',
  describe: 'Run many scripts inside a workspace',
  builder: (yargs) =>
    applyMiddlewares(yargs, [
      setupInk,
      loadProject,
      loadWorkspace
    ])
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
    const manager = container.get(TaskManager);
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
      return yargs.exit(1, new Error('Task failed !'));
    }
  }
});
