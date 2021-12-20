import { TaskSet, WorkspaceDepsMode } from '@jujulego/jill-core';

import { Arguments, Builder } from '../command';
import { WorkspaceArgs, WorkspaceCommand } from '../workspace.command';
import { TaskLogger } from '../task-logger';

// Types
export interface RunArgs extends WorkspaceArgs {
  script: string;
  'deps-mode': WorkspaceDepsMode;
}

// Command
export class RunCommand extends WorkspaceCommand<RunArgs> {
  // Attributes
  readonly name = 'run <script>';
  readonly description = 'Run script inside workspace';

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & RunArgs> {
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
    );
  }

  protected async run(args: Arguments<RunArgs>): Promise<number> {
    await super.run(args);
    this.spinner.stop();

    // Run build task
    const set = new TaskSet();
    const task = await this.workspace.run(args.script, args['--']?.map(arg => arg.toString()), {
      buildDeps: args['deps-mode']
    });
    set.add(task);

    const tlogger = new TaskLogger();
    tlogger.on('spin-simple', (tsk) => tsk === task ? `Running ${args.script} in ${this.workspace.name} ...` : `Building ${tsk.context.workspace?.name} ...`);
    tlogger.on('fail', (tsk) => tsk === task ? `${args.script} failed` : `Failed to build ${tsk.context.workspace?.name}`);
    tlogger.on('succeed', (tsk) => tsk === task ? `${this.workspace.name} ${args.script} done` : `${tsk.context.workspace?.name} built`);
    tlogger.connect(set);

    set.start();
    const [result] = await set.waitFor('finished');
    return result.failed === 0 ? 0 : 1;
  }
}