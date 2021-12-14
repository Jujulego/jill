import { TaskSet, WorkspaceDepsMode } from '@jujulego/jill-core';

import { ProjectCommand } from './project.command';
import { TaskLogger } from '../task-logger';

// Command
export class RunCommand extends ProjectCommand {
  // Methods
  async run(): Promise<number | void> {
    // Define command
    const argv = await this.define('run', 'Run script inside workspace', y => y
      .positional('script', { type: 'string', demandOption: true })
      .options({
        workspace: {
          alias: 'w',
          type: 'string',
          desc: 'Workspace to use'
        },
        'deps-mode': {
          choice: ['all', 'prod', 'none'],
          default: 'all' as WorkspaceDepsMode,
          desc: 'Dependency selection mode:\n' +
            ' - all = dependencies AND devDependencies\n' +
            ' - prod = dependencies\n' +
            ' - none = nothing'
        },
      })
    );

    // Load workspace
    this.spinner.start(`Loading "${argv.workspace || '.'}" workspace`);
    const wks = await (argv.workspace ? this.project.workspace(argv.workspace) : this.project.currentWorkspace());

    if (!wks) {
      this.spinner.fail(`Workspace "${argv.workspace || '.'}" not found`);
      return 1;
    }

    this.spinner.stop();

    // Run build task
    const set = new TaskSet();
    const task = await wks.run(argv.script, argv['--']?.map(arg => arg.toString()), {
      buildDeps: argv['deps-mode']
    });
    set.add(task);

    const tlogger = new TaskLogger();
    tlogger.on('spin-simple', (tsk) => tsk === task ? `Running ${argv.script} in ${wks.name} ...` : `Building ${tsk.context.workspace?.name} ...`);
    tlogger.on('fail', (tsk) => tsk === task ? `${argv.script} failed` : `Failed to build ${tsk.context.workspace?.name}`);
    tlogger.on('succeed', (tsk) => tsk === task ? `${wks.name} ${argv.script} done` : `${tsk.context.workspace?.name} built`);
    tlogger.connect(set);

    set.start();
    const [result] = await set.waitFor('finished');
    return result.failed === 0 ? 0 : 1;
  }
}