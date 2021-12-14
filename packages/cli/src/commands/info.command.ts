import chalk from 'chalk';
import path from 'path';

import { ProjectCommand } from './project.command';
import { printDepsTree } from '../utils/deps-tree';

// Command
export class InfoCommand extends ProjectCommand {
  // Methods
  async run(): Promise<number | void> {
    // Define command
    const argv = await this.define('info', 'Print workspace data', y => y.options({
      workspace: {
        alias: 'w',
        type: 'string',
        desc: 'Workspace to use'
      }
    }));

    // Load workspace
    this.spinner.start(`Loading "${argv.workspace || '.'}" workspace`);
    const wks = await (argv.workspace ? this.project.workspace(argv.workspace) : this.project.currentWorkspace());

    if (!wks) {
      this.spinner.fail(`Workspace "${argv.workspace || '.'}" not found`);
      return 1;
    }

    this.spinner.stop();

    // Print data
    this.log(chalk`Workspace {bold ${wks.name}}:`);
    this.log(chalk`{bold Version:}   ${wks.manifest.version || chalk.grey('unset')}`);
    this.log(chalk`{bold Directory:} ${path.relative(process.cwd(), wks.cwd) || '.'}`);
    this.log('');
    await printDepsTree(wks);
  }
}