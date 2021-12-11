import { Project } from '@jujulego/jill-core';
import { Flags } from '@oclif/core';

import BaseCommand from './base.command';

// Command
export default abstract class ProjectCommand extends BaseCommand {
  // Statics
  static flags = {
    ...BaseCommand.flags,
    'package-manager': Flags.enum({
      options: ['yarn', 'npm'],
      description: 'Force package manager'
    }),
    project: Flags.string({
      char: 'p',
      default: () => Project.searchProjectRoot(process.cwd()),
      description: 'Project root directory'
    }),
  }

  // Attributes
  private _project?: Project;

  // Methods
  protected async init() {
    await super.init();

    // Instantiate project
    const { flags } = await this.parse(this.ctor);
    this._project = new Project(flags.project, { packageManager: flags['package-manager'] });
  }

  // Properties
  get project(): Project {
    if (!this._project) {
      throw new Error(`${this.ctor.name} not yet initialised !`);
    }

    return this._project;
  }
}