import { buildCommand } from '@jujulego/jill';
import { Command, Usage } from 'clipanion';

import { JillCommand } from './base';

// Command
export class BuildCommand extends JillCommand {
  // Statics
  static usage: Usage = {
    description: 'Build workspace'
  };

  // Methods
  @Command.Path('jill', 'build')
  async execute(): Promise<number> {
    const prj = await this.jillPrj();
    const wks = await this.yarnWks();

    return await buildCommand(prj, { workspace: wks.manifest.name?.name }) || 0;
  }
}