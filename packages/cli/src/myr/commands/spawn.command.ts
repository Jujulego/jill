import { ProjectCommand } from '../../commands/project.command';
import { MyrClient } from '../myr-client';

// Command
export class SpawnCommand extends ProjectCommand {
  // Methods
  protected async run(): Promise<number | void> {
    // Define command
    const argv = await this.define('spawn <command>', 'Spawn new task', y => y
      .positional('command', { type: 'string', demandOption: true })
      .options({
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

    // Spawn task
    this.spinner.start('Connecting to myr');
    const client = new MyrClient(this.project);

    this.spinner.start('Spawning task');
    const task = await client.spawn(wks.cwd, argv.command, argv['--']?.map(arg => arg.toString()));

    this.spinner.succeed(`Task ${task.id} spawned`);
  }
}