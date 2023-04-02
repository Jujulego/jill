import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { type IMiddleware, Middleware } from '@/src/modules/middleware';
import { SpinnerService } from '@/src/commons/spinner.service';
import { container } from '@/src/inversify.config';
import { CURRENT } from '@/src/project/constants';
import { Project } from '@/src/project/project';
import { ProjectRepository } from '@/src/project/project.repository';
import { type PackageManager } from '@/src/project/types';

// Types
export interface ILoadProjectArgs {
  project: string;
  'package-manager'?: PackageManager;
}

// Middleware
@Middleware()
export class LoadProject implements IMiddleware<ILoadProjectArgs> {
  // Constructor
  constructor(
    @inject(SpinnerService)
    private readonly spinner: SpinnerService,
    @inject(ProjectRepository)
    private readonly projects: ProjectRepository,
  ) {}

  // Methods
  builder(parser: Argv) {
    return parser
      .option('project', {
        alias: 'p',
        type: 'string',
        default: process.cwd(),
        description: 'Project root directory'
      })
      .option('package-manager', {
        choices: ['yarn', 'npm'] as const,
        type: 'string',
        description: 'Force package manager'
      });
  }

  async handler(args: ArgumentsCamelCase<ILoadProjectArgs>): Promise<void> {
    try {
      this.spinner.spin('Loading project ...');
      const root = args.project = await this.projects.searchProjectRoot(args.project);

      container.bind(Project)
        .toDynamicValue(() => new Project(root, {
          packageManager: args.packageManager
        }))
        .whenTargetNamed(CURRENT);
    } finally {
      this.spinner.stop();
    }
  }
}
