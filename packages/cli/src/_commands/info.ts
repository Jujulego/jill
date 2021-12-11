import { PackageManager, Project } from '@jujulego/jill-core';
import { Command, Flags } from '@oclif/core';
import path from 'path';
import chalk from 'chalk';

import { logger } from '../logger';
import { printDepsTree } from '../utils/deps-tree';

// Command
export default class InfoCommand extends Command {
  // Attributes
  static description = 'Print workspace data';
  static flags = {
    packageManager: Flags.string({
      name: 'package-manager',
      options: ['yarn', 'npm'],
      description: 'Force package manager'
    }),
    project: Flags.string({
      char: 'p',
      default: () => Project.searchProjectRoot(process.cwd()),
      description: 'Project root directory'
    }),
    verbosity: Flags.string({
      char: 'v',
      default: 'info',
      options: ['warn', 'info', 'verbose', 'debug']
    }),
    workspace: Flags.string({
      char: 'w',
      description: 'Workspace to use'
    }),
  };
  static args = [];

  // Methods
  async run(): Promise<void> {
    const { flags } = await this.parse(InfoCommand);

    logger.level = flags.verbosity;
    logger.spin('Loading project');

    // Get workspace
    const prj = new Project(flags.project, { packageManager: flags.packageManager as PackageManager });
    const wks = await (flags.workspace ? prj.workspace(flags.workspace) : prj.currentWorkspace());

    if (!wks) {
      logger.fail('Workspace \'.\' not found');
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
