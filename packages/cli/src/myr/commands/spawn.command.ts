import { Arguments, Builder, WorkspaceArgs, WorkspaceCommand } from '@jujulego/jill-common';
import { MyrClient } from '../myr-client';

// Types
export interface SpawnArgs extends WorkspaceArgs {
  command: string;
}

// Command
export class SpawnCommand extends WorkspaceCommand<SpawnArgs> {
  // Attributes
  readonly name = 'spawn <command>';
  readonly description = 'Spawn new task';

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & SpawnArgs> {
    return super.define(y => builder(y)
      .positional('command', { type: 'string', demandOption: true })
    );
  }

  protected async run(args: Arguments<SpawnArgs>): Promise<number | void> {
    await super.run(args);

    // Spawn task
    this.spinner.start('Connecting to myr');
    const client = new MyrClient(this.project);

    this.spinner.start('Spawning task');
    const task = await client.spawn(this.workspace.cwd, args.command, args['--']?.map(arg => arg.toString()));

    this.spinner.succeed(`Task ${task.id} spawned`);
  }
}
