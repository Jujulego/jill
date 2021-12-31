import { Arguments, Builder, WorkspaceArgs, WorkspaceCommand } from '@jujulego/jill-common';
import { combine, Workspace } from '@jujulego/jill-core';

import { MyrClient } from './myr-client';

// Types
export interface WatchArgs extends WorkspaceArgs {
  script: string;
  daemon: boolean;
}

// Command
export class WatchCommand extends WorkspaceCommand<WatchArgs> {
  // Attributes
  readonly name = 'watch <script>';
  readonly description = 'Run script with watcher inside workspace and watch over deps';

  // Methods
  private async spawnDepsTree(myr: MyrClient, wks: Workspace, set: Set<string>): Promise<number> {
    let count = 0;

    for await (const ws of combine(wks.dependencies(), wks.devDependencies())) {
      if (set.has(ws.cwd)) continue;
      set.add(ws.cwd);

      // Spawn dependencies
      count += await this.spawnDepsTree(myr, ws, set);

      // Spawn task
      const tsk = await myr.spawnScript(ws, 'watch');
      this.logger.log('info', `Task ${tsk.id} spawned`, { label: ws.name });

      count++;
    }

    return count;
  }

  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & WatchArgs> {
    return super.define(y => builder(y)
      .positional('script', { type: 'string', demandOption: true })
      .option('daemon', {
        alias: 'd',
        boolean: true,
        default: false,
        desc: 'Run watch script also in background'
      })
    );
  }

  protected async run(args: Arguments<WatchArgs>): Promise<number> {
    await super.run(args);

    // Spawn watch
    this.spinner.start('Spawning dependencies watch tasks');
    const myr = new MyrClient(this.project);
    const count = await this.spawnDepsTree(myr, this.workspace, new Set());

    // Spawn task
    if (args.daemon) {
      this.spinner.start(`Spawning ${args.script} task`);
      const tsk = await myr.spawnScript(this.workspace, args.script, args['--']?.map(arg => arg.toString()));
      this.logger.log('info', `Task ${tsk.id} spawned`, { label: this.workspace.name });
      this.spinner.succeed(`${count + 1} watch tasks spawned`);

      return 0;
    } else {
      this.spinner.succeed(`${count} watch tasks spawned`);

      const tsk = await this.workspace.run(args.script, args['--']?.map(arg => arg.toString()), { buildDeps: 'none' });
      tsk.start();

      await tsk.waitFor('done', 'failed');
      return tsk.exitCode === 0 ? 0 : 1;
    }
  }
}
