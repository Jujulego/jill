import chalk from 'chalk';
import path from 'path';

import { Arguments, Builder } from '../command';
import { printDepsTree } from '../utils/deps-tree';
import { ProjectArgs, ProjectCommand } from './project.command';

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

  protected async run(args: Arguments<InfoArgs>): Promise<number | void> {
    await super.run(args);

    // Load workspace
    this.spinner.start(`Loading "${args.workspace || '.'}" workspace`);
    const wks = await (args.workspace ? this.project.workspace(args.workspace) : this.project.currentWorkspace());

    if (!wks) {
      this.spinner.fail(`Workspace "${args.workspace || '.'}" not found`);
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