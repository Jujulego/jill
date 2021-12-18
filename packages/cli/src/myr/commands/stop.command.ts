import { Arguments } from '../../command';
import { ProjectArgs, ProjectCommand } from '../../commands/project.command';
import { MyrClient } from '../myr-client';

// Command
export class StopCommand extends ProjectCommand {
  // Attributes
  readonly name = 'stop';
  readonly description = 'Stop myr server. This will kill all running tasks';

  // Methods
  protected async run(argv: Arguments<ProjectArgs>): Promise<void> {
    await super.run(argv);

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