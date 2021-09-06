import { eachCommand } from '@jujulego/jill';
import { Command, Usage } from 'clipanion';

import { JillCommand } from './base';

// Command
export class EachCommand extends JillCommand {
  // Attributes
  @Command.String({ required: true })
  script: string;

  @Command.Boolean('--private', { description: 'Print only private workspaces' })
  private?: boolean;

  @Command.String('-a,--affected', { tolerateBoolean: true, description: 'Print only affected workspaces towards given git revision. If no revision is given test against master' })
  affected?: string;

  @Command.String('--affected-rev-sort', { description: 'Sort applied to git tag / git branch command' })
  affectedRevSort?: string;

  @Command.String('--affected-rev-fallback', { description: 'Fallback revision, used if no revision matching the given format is found' })
  affectedRevFallback?: string;

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
      'affected-rev-sort': this.affectedRevSort,
      'affected-rev-fallback': this.affectedRevFallback || 'master',
      private: this.private,
      '--': this.options
    });
  }
}