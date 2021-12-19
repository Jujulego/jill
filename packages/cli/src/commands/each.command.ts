import { Task, TaskSet, Workspace, WorkspaceDepsMode } from '@jujulego/jill-core';

import { Arguments, Builder } from '../command';
import { AffectedFilter, Filter } from '../filters';
import { Pipeline } from '../pipeline';
import { TaskLogger } from '../task-logger';
import { ProjectArgs, ProjectCommand } from '../project.command';

// Types
export interface EachArgs extends ProjectArgs {
  script: string;
  'deps-mode': WorkspaceDepsMode;

  private: boolean | undefined;
  affected: string | undefined;
  'affected-rev-sort': string | undefined;
  'affected-rev-fallback': string;
}

// Command
export class EachCommand extends ProjectCommand<EachArgs> {
  // Attributes
  readonly name = 'each <script>';
  readonly description = 'Run script on selected workspaces';

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & EachArgs> {
    return super.define(y => builder(y)
      .positional('script', { type: 'string', demandOption: true })
      .option('deps-mode', {
        choice: ['all', 'prod', 'none'],
        default: 'all' as WorkspaceDepsMode,
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      })
      .option('private', {
        type: 'boolean',
        group: 'Filters:',
        desc: 'Print only private workspaces',
      })
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
      })
    );
  }

  protected async run(args: Arguments<EachArgs>): Promise<number> {
    await super.run(args);

    // Setup pipeline
    const pipeline = new Pipeline();
    pipeline.add(Filter.scripts([args.script]));

    if (args.private !== undefined) {
      pipeline.add(Filter.privateWorkspace(args.private));
    }

    if (args.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        args.affected,
        args['affected-rev-fallback'],
        args['affected-rev-sort']
      ));
    }

    // Filter
    const workspaces: Workspace[] = [];

    for await (const wks of pipeline.filter(this.project.workspaces())) {
      workspaces.push(wks);
    }

    if (workspaces.length === 0) {
      this.spinner.fail('No workspace found !');
      return 1;
    }

    this.spinner.stop();
    this.logger.verbose(`Will run ${args.script} in ${workspaces.map(wks => wks.name).join(', ')}`);

    // Run tasks
    const set = new TaskSet();
    const tasks: Task[] = [];

    for (const wks of workspaces) {
      const task = await wks.run(args.script, args['--']?.map(arg => arg.toString()), {
        buildDeps: args['deps-mode']
      });

      tasks.push(task);
      set.add(task);
    }

    const tlogger = new TaskLogger();
    tlogger.on('spin-multiple', (count) => `Working in ${count} packages ...`);
    tlogger.on('spin-simple', (tsk) => tasks.includes(tsk) ? `Running ${args.script} in ${tsk.context.workspace?.name} ...` : `Building ${tsk.context.workspace?.name} ...`);
    tlogger.on('fail', (tsk) => tasks.includes(tsk) ? `${tsk.context.workspace?.name} ${args.script} failed` : `Failed to build ${tsk.context.workspace?.name}`);
    tlogger.on('succeed', (tsk) => tasks.includes(tsk) ? `${tsk.context.workspace?.name} ${args.script} done` : `${tsk.context.workspace?.name} built`);
    tlogger.connect(set);

    set.start();
    const [result] = await set.waitFor('finished');
    return result.failed === 0 ? 0 : 1;
  }
}