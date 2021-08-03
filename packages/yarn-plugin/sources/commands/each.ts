import { eachCommand } from '@jujulego/jill';
import { Command, Usage } from 'clipanion';

import { JillCommand } from './base';

// Command
export class EachCommand extends JillCommand {
  // Attributes
  @Command.String({ required: true })
  script: string;

  @Command.String('-a,--affected', { tolerateBoolean: true, description: 'Print only affected workspaces towards given git revision. If no revision is given test against master' })
  affected?: string;

  @Command.Boolean('--private', { description: 'Print only private workspaces' })
  private?: boolean;

  @Command.Proxy()
  options?: string[];

  // Statics
  static usage: Usage = {
    description: 'Run script on selected workspaces'
  };

  // Methods
  @Command.Path('jill', 'each')
  async execute(): Promise<void> {
    const prj = await this.jillPrj();

    await eachCommand(prj, {
      script: this.script,
      affected: this.affected === '' ? 'master' : this.affected,
      private: this.private,
      '--': this.options
    });
  }
}