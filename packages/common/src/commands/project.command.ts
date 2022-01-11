import { PackageManager, Project } from '@jujulego/jill-core';

import { Arguments, Builder, Command } from '../command';
import { ApplicationArgs } from '../application';

// Types
export interface ProjectArgs extends ApplicationArgs {
  project: string | undefined;
  'package-manager': PackageManager | undefined;
}

// Command
export abstract class ProjectCommand<A extends ProjectArgs = ProjectArgs> extends Command<ProjectArgs> {
  // Attributes
  private _project?: Project;

  // Methods
  protected define<U>(builder: Builder<U>): Builder<U & ProjectArgs> {
    return y => builder(y)
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
      });
  }

  protected async run(args: Arguments<A>): Promise<number | void> {
    // Load project
    this.spinner.start('Loading project');
    const dir = args.project ?? await Project.searchProjectRoot(process.cwd());

    this._project = new Project(dir, {
      packageManager: args['package-manager']
    });
  }

  // Properties
  get project(): Project {
    if (!this._project) {
      throw new Error('Project not yet loaded !');
    }

    return this._project;
  }
}
