import { combine, Workspace } from '@jujulego/jill-core';

import { ProjectCommand } from '../commands/project.command';
import { MyrClient } from './myr-client';

// Command
export class WatchCommand extends ProjectCommand {
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

  protected async run(): Promise<number | void> {
    // Define command
    const argv = await this.define('watch <script>', 'Run script inside workspace and watch over deps', y => y
      .positional('script', { type: 'string', demandOption: true })
      .options({
        daemon: {
          alias: 'd',
          boolean: true,
          default: false,
          desc: 'Run watch script also in background'
        },
        workspace: {
          alias: 'w',
          type: 'string',
          desc: 'Workspace to use'
        }
      })
    );

    // Load workspace
    this.spinner.start(`Loading "${argv.workspace || '.'}" workspace`);
    const wks = await (argv.workspace ? this.project.workspace(argv.workspace) : this.project.currentWorkspace());

    if (!wks) {
      this.spinner.fail(`Workspace "${argv.workspace || '.'}" not found`);
      return 1;
    }

    // Spawn watch
    this.spinner.start('Spawning dependencies watch tasks');
    const myr = new MyrClient(this.project);
    const count = await this.spawnDepsTree(myr, wks, new Set());

    // Spawn task
    if (argv.daemon) {
      this.spinner.start(`Spawning ${argv.script} task`);
      const tsk = await myr.spawnScript(wks, argv.script, argv['--']?.map(arg => arg.toString()));
      this.logger.log('info', `Task ${tsk.id} spawned`, { label: wks.name });
      this.spinner.succeed(`${count + 1} watch tasks spawned`);

      return 0;
    } else {
      this.spinner.succeed(`${count} watch tasks spawned`);

      const tsk = await wks.run(argv.script, argv['--']?.map(arg => arg.toString()), { buildDeps: 'none' });
      tsk.start();

      await tsk.waitFor('done', 'failed');
      return tsk.exitCode === 0 ? 0 : 1;
    }
  }
}