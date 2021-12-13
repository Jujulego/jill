import { PackageManager, Project } from '@jujulego/jill-core';

import { BaseCommand } from './base.command';
import { CommandBuilder } from '../command';

// Command
export abstract class ProjectCommand extends BaseCommand {
  // Attributes
  private _project?: Project;

  // Methods
  protected async define<U>(command: string | readonly string[], description: string, builder: CommandBuilder<U>) {
    const argv = await super.define(command, description, y => builder(y)
      .option('project', {
        alias: 'p',
        type: 'string',
        description: 'Project root directory'
      })
      .option('package-manager', {
        choices: ['yarn', 'npm'],
        default: undefined as PackageManager | undefined,
        type: 'string',
        description: 'Force package manager'
      })
    );

    // Load project
    this.spinner.start('Loading project');
    const dir = argv.project ?? await Project.searchProjectRoot(process.cwd());

    this._project = new Project(dir, {
      packageManager: argv['package-manager']
    });

    return argv;
  }

  // Properties
  get project(): Project {
    if (!this._project) {
      throw new Error('Project not yet loaded !');
    }

    return this._project;
  }
}