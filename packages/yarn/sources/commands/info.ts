import { infoCommand } from '@jujulego/jill';
import { Command } from 'clipanion';

import { JillCommand } from './base';

// Command
export class InfoCommand extends JillCommand {
  // Methods
  @Command.Path('jill', 'info')
  async execute(): Promise<number> {
    const prj = await this.jillPrj();
    const wks = await this.yarnWks();

    return await infoCommand(prj, { workspace: wks.manifest.name?.name || '' }) || 0;
  }
}