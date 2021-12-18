import { combine, Workspace } from '@jujulego/jill-core';

import { ProjectArgs, ProjectCommand } from '../commands/project.command';
import { MyrClient } from './myr-client';
import { Arguments, Builder } from '../command';

// Types
export interface WatchArgs extends ProjectArgs {
  script: string;
  daemon: boolean;
  workspace: string | undefined;
}

// Command
export class WatchCommand extends ProjectCommand<WatchArgs> {
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
      .option('workspace', {
        alias: 'w',
        type: 'string',
        desc: 'Workspace to use'
      })
    );
  }

  protected async run(args: Arguments<WatchArgs>): Promise<number> {
    await super.run(args);

    // Load workspace
    this.spinner.start(`Loading "${args.workspace || '.'}" workspace`);
    const wks = await (args.workspace ? this.project.workspace(args.workspace) : this.project.currentWorkspace());

    if (!wks) {
      this.spinner.fail(`Workspace "${args.workspace || '.'}" not found`);
      return 1;
    }

    // Spawn watch
    this.spinner.start('Spawning dependencies watch tasks');
    const myr = new MyrClient(this.project);
    const count = await this.spawnDepsTree(myr, wks, new Set());

    // Spawn task
    if (args.daemon) {
      this.spinner.start(`Spawning ${args.script} task`);
      const tsk = await myr.spawnScript(wks, args.script, args['--']?.map(arg => arg.toString()));
      this.logger.log('info', `Task ${tsk.id} spawned`, { label: wks.name });
      this.spinner.succeed(`${count + 1} watch tasks spawned`);

      return 0;
    } else {
      this.spinner.succeed(`${count} watch tasks spawned`);

      const tsk = await wks.run(args.script, args['--']?.map(arg => arg.toString()), { buildDeps: 'none' });
      tsk.start();

      await tsk.waitFor('done', 'failed');
      return tsk.exitCode === 0 ? 0 : 1;
    }
  }
}