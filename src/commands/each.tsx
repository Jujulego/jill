import { waitForEvent } from '@jujulego/event-tree';
import { TaskSet } from '@jujulego/tasks';

import { AffectedFilter } from '@/src/filters/affected.filter';
import { Pipeline } from '@/src/filters/pipeline';
import { PrivateFilter } from '@/src/filters/private.filter';
import { ScriptsFilter } from '@/src/filters/scripts.filter';
import { loadProject, setupInk } from '@/src/middlewares';
import { Project } from '@/src/project/project';
import { WorkspaceDepsMode } from '@/src/project/workspace';
import { container, CURRENT, INK_APP } from '@/src/services/inversify.config';
import { SpinnerService } from '@/src/services/spinner.service';
import { TASK_MANAGER } from '@/src/services/task-manager.config';
import { Layout, TaskManagerSpinner } from '@/src/ui';
import { applyMiddlewares, defineCommand } from '@/src/utils/yargs';

// Command
export default defineCommand({
  command: 'each <script>',
  describe: 'Run script on many workspaces',
  builder: async (yargs) =>
    (await applyMiddlewares(yargs, [
      setupInk,
      loadProject,
    ]))
    // Run options
    .positional('script', { type: 'string', demandOption: true })
    .option('deps-mode', {
      choice: ['all', 'prod', 'none'],
      default: 'all' as WorkspaceDepsMode,
      desc: 'Dependency selection mode:\n' +
        ' - all = dependencies AND devDependencies\n' +
        ' - prod = dependencies\n' +
        ' - none = nothing'
    })

    // Filters
    .option('private', {
      type: 'boolean',
      group: 'Filters:',
      desc: 'Print only private workspaces',
    })

    // Affected filter
    .option('affected', {
      alias: 'a',
      type: 'string',
      coerce: (rev: string) => rev === '' ? 'master' : rev,
      group: 'Affected:',
      desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master.\n' +
        'Replaces %name by workspace name.',
    })
    .option('affected-rev-sort', {
      type: 'string',
      group: 'Affected:',
      desc: 'Sort applied to git tag / git branch command',
    })
    .option('affected-rev-fallback', {
      type: 'string',
      default: 'master',
      group: 'Affected:',
      desc: 'Fallback revision, used if no revision matching the given format is found',
    }),
  async handler(args) {
    const app = container.get(INK_APP);
    const project = container.getNamed(Project, CURRENT);
    const manager = container.get(TASK_MANAGER);
    const spinner = container.get(SpinnerService);

    try {
      spinner.spin('Loading workspaces ...');

      // Setup pipeline
      const pipeline = new Pipeline();
      pipeline.add(new ScriptsFilter([args.script]));

      if (args.private !== undefined) {
        pipeline.add(new PrivateFilter(args.private));
      }

      if (args.affected !== undefined) {
        pipeline.add(new AffectedFilter(
          args.affected,
          args.affectedRevFallback,
          args.affectedRevSort
        ));
      }

      // Extract arguments
      const rest = args._.map(arg => arg.toString());

      if (rest[0] === 'each') {
        rest.splice(0, 1);
      }

      // Create script tasks
      const tasks = new TaskSet(manager);

      for await (const wks of pipeline.filter(project.workspaces())) {
        tasks.add(await wks.run(args.script, rest, {
          buildDeps: args.depsMode,
        }));
      }

      if (tasks.tasks.length === 0) {
        spinner.failed('No workspace found !');
        return process.exit(1);
      }

      spinner.stop();

      // Render
      app.rerender(
        <Layout>
          <TaskManagerSpinner manager={manager} />
        </Layout>
      );

      // Start and wait for result
      tasks.start();

      const result = await waitForEvent(tasks, 'finished');

      if (result.failed > 0) {
        return process.exit(1);
      }
    } finally {
      spinner.stop();
    }
  }
});
