import { waitForEvent } from '@jujulego/event-tree';
import { GroupTask, ParallelGroup, SequenceGroup, TaskManager } from '@jujulego/tasks';
import ink from 'ink';
import yargs from 'yargs';

import { loadProject, loadWorkspace, setupInk } from '../middlewares';
import { Workspace, WorkspaceDepsMode } from '../project';
import { container, CURRENT, INK_APP, Logger } from '../services';
import { Layout, TaskManagerSpinner } from '../ui';
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
      })
      .option('parallel', {
        type: 'boolean',
        desc: 'Runs given scripts in parallel'
      })
      .option('sequence', {
        type: 'boolean',
        desc: 'Runs given scripts in sequence'
      })
      .conflicts('parallel', 'sequence')
      .check((args) => {
        if (!args.parallel && !args.sequence) {
          throw new Error('You must at least set either --parallel or --sequence to select group management method');
        }

        return true;
      }),
  async handler(args) {
    const app = container.get<ink.Instance>(INK_APP);
    const workspace = container.getNamed(Workspace, CURRENT);
    const manager = container.get(TaskManager);

    // Run script in workspace
    let group: GroupTask;

    if (args.sequence) {
      group = new SequenceGroup('In sequence', {}, {
        logger: container.get(Logger),
      });
    } else if (args.parallel) {
      group = new ParallelGroup('In parallel', {}, {
        logger: container.get(Logger),
      });
    } else {
      throw new Error('You must at least set either --parallel or --sequence to select group management method');
    }

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
