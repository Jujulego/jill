import { waitForEvent } from '@jujulego/event-tree';
import { ParallelGroup, SequenceGroup, TaskManager } from '@jujulego/tasks';
import ink from 'ink';
import yargs from 'yargs';

import { loadProject, loadWorkspace, setupInk } from '../middlewares';
import { Workspace, WorkspaceDepsMode } from '../project';
import { container, CURRENT, INK_APP, Logger } from '../services';
import { Layout, TasksSpinner } from '../ui';
import { applyMiddlewares, defineCommand } from '../utils';

// Command
export default defineCommand({
  command: 'group <scripts..>',
  describe: 'Run many scripts inside a workspace',
  builder: (yargs) =>
    applyMiddlewares(yargs, [
      setupInk,
      loadProject,
      loadWorkspace
    ])
      .positional('scripts', { type: 'string', demandOption: true, array: true })
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

    // Run script in workspace
    const group = new ParallelGroup('test parallel group', {}, {
    // const group = new SequenceGroup('test sequence group', {}, {
      logger: container.get(Logger),
    });

    for (const script of args.scripts) {
      const task = await workspace.run(script, [], {
        buildDeps: args.depsMode,
      });

      group.add(task);
    }

    manager.add(group);

    // Render
    app.rerender(
      <Layout>
        <TasksSpinner manager={manager} />
      </Layout>
    );

    // Wait for result
    const result = await waitForEvent(group, 'completed');

    if (result.status === 'failed') {
      return yargs.exit(1, new Error('Task failed !'));
    }
  }
});
