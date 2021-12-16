import { ProjectCommand } from '../../commands/project.command';
import { MyrClient } from '../myr-client';

// Command
export class KillCommand extends ProjectCommand {
  // Methods
  protected async run(): Promise<number | void> {
    // Define command
    const argv = await this.define('kill <id>', 'Kill task', y => y
      .positional('id', { type: 'string', demandOption: true })
    );

    // Spawn task
    this.spinner.start('Connecting to myr');
    const client = new MyrClient(this.project);

    this.spinner.start('Killing task');
    const task = await client.kill(argv.id);

    if (task) {
      this.spinner.succeed(`Task ${task.id} killed`);
      return 0;
    } else {
      this.spinner.fail(`Task ${argv.id} not found`);
      return 1;
    }
  }
}