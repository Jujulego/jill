import { ProjectCommand } from '../../commands/project.command';
import { MyrClient } from '../myr-client';

// Command
export class StopCommand extends ProjectCommand {
  // Methods
  async run(): Promise<number | void> {
    // Define command
    await this.define('stop', 'Stop myr server. This will kill all running tasks', y => y);

    // Spawn task
    this.spinner.start('Stopping myr');
    const client = new MyrClient(this.project);
    const ok = await client.stop();

    if (ok) {
      this.spinner.succeed('myr stopped');
    } else {
      this.spinner.stop();
      this.logger.warn('myr was not running');
    }
  }
}