import { Arguments, Builder, ProjectArgs, ProjectCommand } from '@jujulego/jill-common';

import { MyrClient } from '../myr-client';

// Types
export interface KillArgs extends ProjectArgs {
  id: string;
}

// Command
export class KillCommand extends ProjectCommand<KillArgs> {
  // Attributes
  readonly name = 'kill <id>';
  readonly description = 'Kill task';

  // Methods
  protected define<U>(builder: Builder<U>): Builder<U & KillArgs> {
    return super.define(y => builder(y)
      .positional('id', { type: 'string', demandOption: true })
    );
  }

  protected async run(args: Arguments<KillArgs>): Promise<number> {
    await super.run(args);

    // Spawn task
    this.spinner.start('Connecting to myr');
    const client = new MyrClient(this.project);

    this.spinner.start('Killing task');
    const task = await client.kill(args.id);

    if (task) {
      this.spinner.succeed(`Task ${task.id} killed`);
      return 0;
    } else {
      this.spinner.fail(`Task ${args.id} not found`);
      return 1;
    }
  }
}
