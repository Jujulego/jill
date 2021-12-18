import { ProjectArgs, ProjectCommand } from '../../commands/project.command';
import { MyrClient } from '../myr-client';
import { Arguments, Builder } from '../../command';

// Types
export interface SpawnArgs extends ProjectArgs {
  command: string;
  workspace: string | undefined;
}

// Command
export class SpawnCommand extends ProjectCommand<SpawnArgs> {
  // Attributes
  readonly name = 'spawn <command>';
  readonly description = 'Spawn new task';

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & SpawnArgs> {
    return super.define(y => builder(y)
      .positional('command', { type: 'string', demandOption: true })
      .option('workspace', {
        alias: 'w',
        type: 'string',
        desc: 'Workspace to use'
      })
    );
  }

  protected async run(args: Arguments<SpawnArgs>): Promise<number | void> {
    await super.run(args);

    // Load workspace
    this.spinner.start(`Loading "${args.workspace || '.'}" workspace`);
    const wks = await (args.workspace ? this.project.workspace(args.workspace) : this.project.currentWorkspace());

    if (!wks) {
      this.spinner.fail(`Workspace "${args.workspace || '.'}" not found`);
      return 1;
    }

    // Spawn task
    this.spinner.start('Connecting to myr');
    const client = new MyrClient(this.project);

    this.spinner.start('Spawning task');
    const task = await client.spawn(wks.cwd, args.command, args['--']?.map(arg => arg.toString()));

    this.spinner.succeed(`Task ${task.id} spawned`);
  }
}