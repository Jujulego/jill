import { logger } from '@jujulego/jill';
import { Project as JProject, Workspace } from '@jujulego/jill-core';
import { CommandContext, Configuration, Project as YProject } from '@yarnpkg/core';
import { npath } from '@yarnpkg/fslib';
import { Command } from 'clipanion';
import path from 'path';
import chalk from 'chalk';

// Command
export class InfoCommand extends Command<CommandContext> {
  // Methods
  @Command.Path('jill', 'info')
  async execute(): Promise<number> {
    logger.spin('Loading project');

    // Load yarn project
    const config = await Configuration.find(this.context.cwd, this.context.plugins);
    const { project, workspace } = await YProject.find(config, this.context.cwd);

    // Load jill project
    const prj = new JProject(npath.fromPortablePath(project.cwd));
    const wks = await prj.workspace((workspace || project.topLevelWorkspace).manifest.name!.name);

    if (!wks) {
      logger.fail(`No workspace found`);
      process.exit(1);

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