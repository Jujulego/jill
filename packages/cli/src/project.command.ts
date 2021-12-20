import { PackageManager, Project } from '@jujulego/jill-core';

import { Arguments, Builder } from './command';
import { BaseArgs, BaseCommand } from './base.command';

// Types
export interface ProjectArgs extends BaseArgs {
  project: string | undefined;
  'package-manager': PackageManager | undefined;
}

// Command
export abstract class ProjectCommand<A extends ProjectArgs = ProjectArgs> extends BaseCommand<A> {
  // Attributes
  private _project?: Project;

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & ProjectArgs> {
    return super.define(y => builder(y)
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
  }

  protected async run(args: Arguments<A>): Promise<number | void> {
    super.run(args);

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