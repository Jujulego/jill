import { Task, TaskSet, Workspace, WorkspaceDepsMode } from '@jujulego/jill-core';

import { ProjectCommand } from './project.command';
import { TaskLogger } from '../task-logger';
import { Pipeline } from '../pipeline';
import { AffectedFilter, Filter } from '../filters';

// Command
export class EachCommand extends ProjectCommand {
  // Methods
  async run(): Promise<number | void> {
    // Define command
    const argv = await this.define('each <script>', 'Run script on selected workspaces', y => y
      .positional('script', { type: 'string', demandOption: true })
      .options({
        'deps-mode': {
          choice: ['all', 'prod', 'none'],
          default: 'all' as WorkspaceDepsMode,
          desc: 'Dependency selection mode:\n' +
            ' - all = dependencies AND devDependencies\n' +
            ' - prod = dependencies\n' +
            ' - none = nothing'
        },
        private: {
          type: 'boolean',
          group: 'Filters:',
          desc: 'Print only private workspaces',
        },
        affected: {
          alias: 'a',
          type: 'string',
          coerce: (rev: string) => rev === '' ? 'master' : rev,
          group: 'Affected:',
          desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master.\n' +
            'Replaces %name by workspace name.',
        },
        'affected-rev-sort': {
          type: 'string',
          group: 'Affected:',
          desc: 'Sort applied to git tag / git branch command',
        },
        'affected-rev-fallback': {
          type: 'string',
          default: 'master',
          group: 'Affected:',
          desc: 'Fallback revision, used if no revision matching the given format is found',
        }
      })
    );

    // Setup pipeline
    const pipeline = new Pipeline();
    pipeline.add(Filter.scripts([argv.script]));

    if (argv.private !== undefined) {
      pipeline.add(Filter.privateWorkspace(argv.private));
    }

    if (argv.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        argv.affected,
        argv['affected-rev-fallback'],
        argv['affected-rev-sort']
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
    this.logger.verbose(`Will run ${argv.script} in ${workspaces.map(wks => wks.name).join(', ')}`);

    // Run tasks
    const set = new TaskSet();
    const tasks: Task[] = [];

    for (const wks of workspaces) {
      const task = await wks.run(argv.script, argv['--']?.map(arg => arg.toString()), {
        buildDeps: argv['deps-mode']
      });

      tasks.push(task);
      set.add(task);
    }

    const tlogger = new TaskLogger();
    tlogger.on('spin-multiple', (count) => `Working in ${count} packages ...`);
    tlogger.on('spin-simple', (tsk) => tasks.includes(tsk) ? `Running ${argv.script} in ${tsk.context.workspace?.name} ...` : `Building ${tsk.context.workspace?.name} ...`);
    tlogger.on('fail', (tsk) => tasks.includes(tsk) ? `${tsk.context.workspace?.name} ${argv.script} failed` : `Failed to build ${tsk.context.workspace?.name}`);
    tlogger.on('succeed', (tsk) => tasks.includes(tsk) ? `${tsk.context.workspace?.name} ${argv.script} done` : `${tsk.context.workspace?.name} built`);
    tlogger.connect(set);

    set.start();
    const [result] = await set.waitFor('finished');
    return result.failed === 0 ? 0 : 1;
  }
}