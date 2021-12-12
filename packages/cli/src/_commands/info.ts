import path from 'path';
import chalk from 'chalk';

import ProjectCommand from '../bases/project.command';
import { workspaceFlag } from '../bases/workspace.flag';
import { logger } from '../logger';
import { printDepsTree } from '../utils/deps-tree';

// Command
export default class InfoCommand extends ProjectCommand {
  // Attributes
  static description = 'Print workspace data';
  static flags = {
    ...ProjectCommand.flags,
    workspace: workspaceFlag()
  };
  static args = [];

  // Methods
  async run(): Promise<void> {
    const { flags } = await this.parse(InfoCommand);

    logger.spin('Loading project');

    // Get workspace
    const wks = await (flags.workspace ? this.project.workspace(flags.workspace) : this.project.currentWorkspace());

    if (!wks) {
      logger.fail(`Workspace '${flags.workspace ?? '.'}' not found`);
      return this.exit(1);
    }

    logger.stop();

    // Print data
    console.log(chalk`Workspace {bold ${wks.name}}:`);
    console.log(chalk`{bold Version:}   ${wks.manifest.version || chalk.grey('unset')}`);
    console.log(chalk`{bold Directory:} ${path.relative(process.cwd(), wks.cwd) || '.'}`);
    console.log('');
    await printDepsTree(wks);
  }
}
