import { logger } from '@jujulego/jill';
import { Workspace } from '@jujulego/jill-core';
import { Command } from 'clipanion';
import chalk from 'chalk';
import path from 'path';
import { JillCommand } from './base';

// Command
export class InfoCommand extends JillCommand {
  // Methods
  @Command.Path('jill', 'info')
  async execute(): Promise<number> {
    logger.spin('Loading project');

    // Load jill project
    const wks = await this.jillWks();

    if (!wks) {
      logger.fail('No workspace found');
      return 1;
    }

    // Get data
    const deps: Workspace[] = [];
    const devDeps: Workspace[] = [];

    for await (const dep of wks.dependencies()) {
      deps.push(dep);
    }

    for await (const dep of wks.devDependencies()) {
      devDeps.push(dep);
    }

    logger.stop();

    // Print data
    console.log(chalk`Workspace {bold ${wks.name}}:`);
    console.log(chalk`{bold Version:}   ${wks.manifest.version}`);
    console.log(chalk`{bold Directory:} ${path.relative(process.cwd(), wks.cwd) || '.'}`);

    if (deps.length > 0) {
      console.log();
      console.log(chalk`{bold Dependencies:}`);
      for (const dep of deps) {
        console.log(`- ${dep.name}`);
      }
    }

    if (devDeps.length > 0) {
      console.log();
      console.log(chalk`{bold Dev-Dependencies:}`);
      for (const dep of devDeps) {
        console.log(`- ${dep.name}`);
      }
    }

    return 0;
  }
}