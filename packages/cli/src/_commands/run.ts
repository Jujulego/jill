import { TaskSet, WorkspaceDepsMode } from '@jujulego/jill-core';
import { Flags } from '@oclif/core';

import ProjectCommand from '../bases/project.command';
import { workspaceFlag } from '../bases/workspace.flag';
import { logger } from '../logger';
import { TaskLogger } from '../task-logger';

// Command
export default class RunCommand extends ProjectCommand {
  // Attributes
  static description = 'Print workspace data';
  static flags = {
    ...ProjectCommand.flags,
    workspace: workspaceFlag(),
    'deps-mode': Flags.enum<WorkspaceDepsMode>({
      default: 'all',
      options: ['all', 'prod', 'none'],
      description: 'Dependency selection mode:\n' +
        ' - all = dependencies AND devDependencies\n' +
        ' - prod = dependencies\n' +
        ' - none = nothing'
    })
  };
  static args = [
    { name: 'script', required: true }
  ];
  static strict = false;

  // Methods
  async run(): Promise<void> {
    const { flags, args, argv } =  await this.parse(RunCommand);

    // Get workspace
    logger.spin('Loading project');
    const wks = await (flags.workspace ? this.project.workspace(flags.workspace) : this.project.currentWorkspace());

    if (!wks) {
      logger.fail(`Workspace ${flags.workspace || '.'} not found`);
      return this.exit(1);
    }

    // Run build task
    const set = new TaskSet();
    const task = await wks.run(args.script, argv.slice(1), {
      buildDeps: flags['deps-mode']
    });
    set.add(task);

    const tlogger = new TaskLogger();
    tlogger.on('spin-simple', (tsk) => tsk === task ? `Running ${args.script} in ${wks.name} ...` : `Building ${tsk.context.workspace?.name} ...`);
    tlogger.on('fail', (tsk) => tsk === task ? `${args.script} failed` : `Failed to build ${tsk.context.workspace?.name}`);
    tlogger.on('succeed', (tsk) => tsk === task ? `${wks.name} ${args.script} done` : `${tsk.context.workspace?.name} built`);
    tlogger.connect(set);

    set.start();
    const [result] = await set.waitFor('finished');
    this.exit(result.failed === 0 ? 0 : 1);
  }
}
