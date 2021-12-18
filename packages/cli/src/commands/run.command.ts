import { TaskSet, WorkspaceDepsMode } from '@jujulego/jill-core';

import { ProjectArgs, ProjectCommand } from './project.command';
import { TaskLogger } from '../task-logger';
import { Arguments, Builder } from '../command';

// Types
export interface RunArgs extends ProjectArgs {
  script: string;
  'deps-mode': WorkspaceDepsMode;
  workspace: string | undefined;
}

// Command
export class RunCommand extends ProjectCommand<RunArgs> {
  // Attributes
  readonly name = 'run <script>';
  readonly description = 'Run script inside workspace';

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & RunArgs> {
    return super.define(y => builder(y)
      .positional('script', { type: 'string', demandOption: true })
      .option('workspace', {
        alias: 'w',
        type: 'string',
        desc: 'Workspace to use'
      })
      .option('deps-mode', {
        choice: ['all', 'prod', 'none'],
        default: 'all' as WorkspaceDepsMode,
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      })
    );
  }

  protected async run(args: Arguments<RunArgs>): Promise<number> {
    await super.run(args);

    // Load workspace
    this.spinner.start(`Loading "${args.workspace || '.'}" workspace`);
    const wks = await (args.workspace ? this.project.workspace(args.workspace) : this.project.currentWorkspace());

    if (!wks) {
      this.spinner.fail(`Workspace "${args.workspace || '.'}" not found`);
      return 1;
    }

    this.spinner.stop();

    // Run build task
    const set = new TaskSet();
    const task = await wks.run(args.script, args['--']?.map(arg => arg.toString()), {
      buildDeps: args['deps-mode']
    });
    set.add(task);

    const tlogger = new TaskLogger();
    tlogger.on('spin-simple', (tsk) => tsk === task ? `Running ${args.script} in ${wks.name} ...` : `Building ${tsk.context.workspace?.name} ...`);
    tlogger.on('fail', (tsk) => tsk === task ? `${args.script} failed` : `Failed to build ${tsk.context.workspace?.name}`);
    tlogger.on('succeed', (tsk) => tsk === task ? `${wks.name} ${args.script} done` : `${tsk.context.workspace?.name} built`);
    tlogger.connect(set);

    set.start();
    const [result] = await set.waitFor('finished');
    return result.failed === 0 ? 0 : 1;
  }
}