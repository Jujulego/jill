import { Task, TaskSet, Workspace } from '@jujulego/jill-core';

import ProjectCommand from '../bases/project.command';
import { depsModeFlag } from '../bases/deps-mode.flag';
import { logger } from '../logger';
import { TaskLogger } from '../task-logger';
import { Flags } from '@oclif/core';
import { Pipeline } from '../pipeline';
import { AffectedFilter, Filter } from '../filters';

// Command
export default class EachCommand extends ProjectCommand {
  // Attributes
  static description = 'Run script on selected workspaces';
  static flags = {
    ...ProjectCommand.flags,
    'deps-mode': depsModeFlag(),
    private: Flags.boolean({
      helpGroup: 'filters',
      description: 'Print only private workspaces',
      allowNo: true
    }),
    affected: Flags.string({
      char: 'a',
      helpGroup: 'affected',
      description: 'Print only affected workspaces towards given git revision.\n' +
        'Replaces %name by workspace name.',
    }),
    ['affected-rev-sort']: Flags.string({
      dependsOn: ['affected'],
      helpGroup: 'affected',
      description: 'Sort applied to git tag / git branch command',
    }),
    ['affected-rev-fallback']: Flags.string({
      name: 'affected-rev-fallback',
      default: 'master',
      helpGroup: 'affected',
      description: 'Fallback revision, used if no revision matching the given format is found',
    }),
  };
  static args = [
    { name: 'script', required: true }
  ];
  static strict = false;

  // Methods
  async run(): Promise<void> {
    const { flags, args, argv } =  await this.parse(EachCommand);

    logger.spin('Loading project');

    // Setup pipeline
    const pipeline = new Pipeline();
    pipeline.add(Filter.scripts([args.script]));

    if (flags.private !== undefined) {
      pipeline.add(Filter.privateWorkspace(flags.private));
    }

    if (flags.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        flags.affected,
        flags['affected-rev-fallback'],
        flags['affected-rev-sort']
      ));
    }

    // Filter
    const workspaces: Workspace[] = [];

    for await (const wks of pipeline.filter(this.project.workspaces())) {
      workspaces.push(wks);
    }

    logger.stop();

    if (workspaces.length === 0) {
      logger.fail('No workspace found !');
      return this.exit(1);
    }

    logger.verbose(`Will run ${args.script} in ${workspaces.map(wks => wks.name).join(', ')}`);

    // Run tasks
    const set = new TaskSet();
    const tasks: Task[] = [];

    for (const wks of workspaces) {
      const task = await wks.run(args.script, argv.slice(1), {
        buildDeps: flags['deps-mode']
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
    this.exit(result.failed === 0 ? 0 : 1);
  }
}
