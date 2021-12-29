import { Arguments, WorkspaceArgs, WorkspaceCommand } from '@jujulego/jill-common';
import { Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import path from 'path';

// Command
export class InfoCommand extends WorkspaceCommand {
  // Attributes
  readonly name = 'info';
  readonly description = 'Print workspace data';

  // Methods
  protected async run(args: Arguments<WorkspaceArgs>): Promise<number | void> {
    await super.run(args);
    this.spinner.stop();

    // Print data
    this.log(chalk`Workspace {bold ${this.workspace.name}}:`);
    this.log(chalk`{bold Version:}   ${this.workspace.manifest.version || chalk.grey('unset')}`);
    this.log(chalk`{bold Directory:} ${path.relative(process.cwd(), this.workspace.cwd) || '.'}`);
    this.log('');
    await this.printDepsTree();
  }

  private async printDepsTree(): Promise<void> {
    this.log(chalk`{bold Dependencies:}`);
    const printed = new Set([this.workspace.name]);

    await this.printTree(this.workspace, '', false, printed);

    if (printed.size === 1) {
      this.log(chalk.grey(`   No dependencies for ${this.workspace.name}`));
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
