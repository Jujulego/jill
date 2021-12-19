import { Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import path from 'path';

import { Arguments, Builder } from '../command';
import { ProjectArgs, ProjectCommand } from './project.command';

// Types
export interface InfoArgs extends ProjectArgs {
  workspace: string | undefined;
}

// Command
export class InfoCommand extends ProjectCommand<InfoArgs> {
  // Attributes
  readonly name = 'info';
  readonly description = 'Print workspace data';

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
    await this.printDepsTree(wks);
  }

  private async printDepsTree(wks: Workspace): Promise<void> {
    this.log(chalk`{bold Dependencies:}`);
    const printed = new Set([wks.name]);

    await this.printTree(wks, '', false, printed);

    if (printed.size === 1) {
      this.log(chalk.grey(`   No dependencies for ${wks.name}`));
    }
  }

  private async printTree(wks: Workspace, level: string, dev: boolean, printed: Set<string>) {
    const workspaces: [Workspace, boolean][] = [];

    for await (const dep of wks.dependencies()) {
      workspaces.push([dep, dev]);
    }

    for await (const dep of wks.devDependencies()) {
      workspaces.push([dep, true]);
    }

    for (let i = 0; i < workspaces.length; ++i) {
      const [dep, isDev] = workspaces[i];
      const isPrinted = printed.has(dep.cwd);
      const isLast = i === workspaces.length - 1;

      // Format
      let name = dep.name;
      if (dep.version) name = chalk`${name}{grey @${dep.version}}`;
      if (isDev) name = chalk.blue(`${name} (dev)`);
      if (isPrinted) name = chalk.italic(name);

      const branchFmt = dev ? chalk.blue : (s: string) => s;

      this.log(`${level}${branchFmt(`${isLast ? '└' : '├' }─ `)}${name}`);

      // Print deps of dep
      if (!isPrinted) {
        printed.add(dep.cwd);
        await this.printTree(dep, level + (isLast ? '   ' : branchFmt('│  ')), isDev, printed);
      }
    }
  }
}