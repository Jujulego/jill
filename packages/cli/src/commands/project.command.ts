import { PackageManager, Project } from '@jujulego/jill-core';

import { BaseCommand } from './base.command';
import { Options } from '../command';
import * as process from 'process';

// Command
export abstract class ProjectCommand extends BaseCommand {
  // Attributes
  private _project?: Project;

  // Methods
  protected async define<O extends Options>(command: string | ReadonlyArray<string>, description: string, options: O) {
    const argv = await super.define(command, description, {
      ...options,
      project: {
        alias: 'p',
        type: 'string',
        description: 'Project root directory'
      },
      'package-manager': {
        choices: ['yarn', 'npm'],
        type: 'string',
        description: 'Force package manager'
      }
    });

    // Load project
    this.spinner.start('Loading project');
    const dir = argv.project ?? await Project.searchProjectRoot(process.cwd());

    this._project = new Project(dir, {
      packageManager: argv['package-manager'] as PackageManager
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