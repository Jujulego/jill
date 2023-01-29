import { type TaskManager } from '@jujulego/tasks';
import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { Command } from '@/src/modules/command';
import { TaskCommand } from '@/src/modules/task-command';
import { SpinnerService } from '@/src/commons/spinner.service';
import { AffectedFilter } from '@/src/filters/affected.filter';
import { Pipeline } from '@/src/filters/pipeline';
import { PrivateFilter } from '@/src/filters/private.filter';
import { ScriptsFilter } from '@/src/filters/scripts.filter';
import { LoadProject } from '@/src/middlewares/load-project';
import { LazyCurrentProject, type Project } from '@/src/project/project';
import { type WorkspaceDepsMode } from '@/src/project/workspace';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';

// Types
export interface IEachCommandArgs {
  script: string;
  'deps-mode': WorkspaceDepsMode;

  // Filters
  private?: boolean;

  // Affected filter
  affected: string;
  'affected-rev-fallback': string;
  'affected-rev-sort'?: string;
}


// Command
@Command({
  command: 'each <script>',
  describe: 'Run script on many workspaces',
  middlewares: [
    LoadProject
  ]
})
export class EachCommand extends TaskCommand<IEachCommandArgs> {
  // Lazy injections
  @LazyCurrentProject()
  readonly project: Project;

  // Constructor
  constructor(
    @inject(SpinnerService)
    private readonly spinner: SpinnerService,
  ) {
    super();
  }

  // Methods
  builder(parser: Argv): Argv<IEachCommandArgs> {
    return this.addTaskOptions(parser)
      // Run options
      .positional('script', { type: 'string', demandOption: true })
      .option('deps-mode', {
        choice: ['all', 'prod', 'none'],
        default: 'all' as const,
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
      .option('affected', {
        alias: 'a',
        type: 'string',
        coerce: (rev) => rev === '' ? 'master' : rev,
        group: 'Filters:',
        desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master. Replaces %name by workspace name.',
      })
      .option('affected-rev-sort', {
        type: 'string',
        group: 'Filters:',
        desc: 'Sort applied to git tag / git branch command',
      })
      .option('affected-rev-fallback', {
        type: 'string',
        default: 'master',
        group: 'Filters:',
        desc: 'Fallback revision, used if no revision matching the given format is found',
      });
  }

  async *prepare(args: ArgumentsCamelCase<IEachCommandArgs>) {
    try {
      this.spinner.spin('Loading workspaces ...');

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
      let empty = true;

      for await (const wks of pipeline.filter(this.project.workspaces())) {
        const task = await wks.run(args.script, rest, {
          buildDeps: args.depsMode,
        });

        yield task;
        empty = false;
      }

      if (empty) {
        this.spinner.failed('No workspace found !');
        return process.exit(1);
      }
    } finally {
      this.spinner.stop();
    }
  }
}
