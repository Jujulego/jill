import { runCommand } from '@jujulego/jill';
import { Command, Usage } from 'clipanion';

import { JillCommand } from './base';

// Command
export class RunCommand extends JillCommand {
  // Attributes
  @Command.String({ required: true })
  script: string;

  @Command.Proxy()
  options?: string[];

  // Statics
  static usage: Usage = {
    description: 'Run script inside workspace'
  };

  // Methods
  @Command.Path('jill', 'run')
  async execute(): Promise<number | void> {
    const prj = await this.jillPrj();
    const wks = await this.yarnWks();

    if (await runCommand(prj, { workspace: wks.manifest.name?.name || '', script: this.script, '--': this.options })) {
      return 1;
    }
  }
}