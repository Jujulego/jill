import chalk from 'chalk';
import path from 'path';

import { Builder } from '../command';
import { printDepsTree } from '../utils/deps-tree';
import { ProjectArgs, ProjectCommand } from './project.command';
import { Arguments } from 'yargs';

// Types
export interface InfoArgs extends ProjectArgs {
  workspace: string | undefined;
}

// Command
export class InfoCommand extends ProjectCommand<InfoArgs> {
  // Attributes
  readonly name: 'info';
  readonly description: 'Print workspace data';

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & InfoArgs> {
    return super.define(y => builder(y)
      .option('workspace', {
        alias: 'w',
        type: 'string',
        desc: 'Workspace to use'
      })
    );
  }

  protected async run(argv: Arguments<InfoArgs>): Promise<void> {
    // Load workspace
    this.spinner.start(`Loading "${argv.workspace || '.'}" workspace`);
    const wks = await (argv.workspace ? this.project.workspace(argv.workspace) : this.project.currentWorkspace());

    if (!wks) {
      this.spinner.fail(`Workspace "${argv.workspace || '.'}" not found`);
      return;
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