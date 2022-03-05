import { Arguments, Builder, WorkspaceArgs, WorkspaceCommand } from '@jujulego/jill-common';
import { combine, Workspace } from '@jujulego/jill-core';
import { format } from 'winston';

import { MyrClient } from './myr-client';
import { IWatchTask, SpawnTaskMode } from './common';

// Types
export interface WatchArgs extends WorkspaceArgs {
  script: string;
  follow: boolean;
}

// Utils
const printLog = format.combine(
  { transform: (info) => Object.assign(info, { [Symbol.for('level')]: info.level }) },
  format.colorize({ all: true }),
);

// Command
export class WatchCommand extends WorkspaceCommand<WatchArgs> {
  // Attributes
  readonly name = 'watch <script>';
  readonly description = 'Run script with watcher inside workspace and watch over deps';

  // Methods
  private async spawnDepsTree(myr: MyrClient, wks: Workspace, set: Set<string>): Promise<[number, Omit<IWatchTask, 'watchOn'>[]]> {
    const tasks: Omit<IWatchTask, 'watchOn'>[] = [];
    let count = 0;

    for await (const ws of combine(wks.dependencies(), wks.devDependencies())) {
      if (set.has(ws.cwd)) continue;
      set.add(ws.cwd);

      // Spawn dependencies
      const [c, deps] = await this.spawnDepsTree(myr, ws, set);
      count += c;

      // Spawn task
      const tsk = await myr.spawnScript(ws, 'watch', [], { mode: SpawnTaskMode.AUTO, watchOn: deps.map(t => t.id) });
      this.logger.log('info', `Task ${tsk.id} spawned`, { label: ws.name });
      tasks.push(tsk);

      count++;
    }

    return [count, tasks];
  }

  protected define<U>(builder: Builder<U>): Builder<U & WatchArgs> {
    return super.define(y => builder(y)
      .positional('script', { type: 'string', demandOption: true })
      .option('follow', {
        alias: 'f',
        type: 'boolean',
        default: false,
        description: 'Subscribe to task logs'
      })
    );
  }

  protected async run(args: Arguments<WatchArgs>): Promise<number> {
    await super.run(args);

    // Spawn watch deps
    this.spinner.start('Spawning dependencies watch tasks');
    const myr = new MyrClient(this.project);
    const [count, deps] = await this.spawnDepsTree(myr, this.workspace, new Set());

    // Spawn task
    this.spinner.start(`Spawning ${args.script} task`);
    const tsk = await myr.spawnScript(this.workspace, args.script, args['--']?.map(arg => arg.toString()), { watchOn: deps.map(t => t.id) });
    this.logger.log('info', `Task ${tsk.id} spawned`, { label: this.workspace.name });
    this.spinner.succeed(`${count + 1} watch tasks spawned`);

    // Follow logs
    if (args.follow) {
      for await (const log of myr.logs$()) {
        if (log.task !== tsk.id) continue;

        printLog.transform(log);
        this.log(log[Symbol.for('message')]);
      }
    }

    return 0;
  }
}
