import { PackageManager, Project } from '@jujulego/jill-core';

import { Arguments, Builder, Command } from '../command';

// Types
export interface ProjectArgs {
  project: string | undefined;
  'package-manager': PackageManager | undefined;
  verbose: number;
}

// Command
export abstract class ProjectCommand<A extends ProjectArgs = ProjectArgs> extends Command<ProjectArgs> {
  // Attributes
  private _project?: Project;

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & ProjectArgs> {
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
      })
      .option('verbose', {
        alias: 'v',
        type: 'count',
        description: 'Set verbosity level (1 for verbose, 2 for debug)',
      });
  }

  protected async run(args: Arguments<A>): Promise<number | void> {
    // Setup logger verbosity
    if (args.verbose === 1) {
      this.logger.level = 'verbose';
    } else if (args.verbose >= 2) {
      this.logger.level = 'debug';
    }

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
