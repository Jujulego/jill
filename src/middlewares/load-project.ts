import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { type IMiddleware, Middleware } from '@/src/modules/middleware.js';
import { SpinnerService } from '@/src/commons/spinner.service.js';
import { container } from '@/src/inversify.config.js';
import { CURRENT } from '@/src/project/constants.js';
import { Project, type PackageManager } from '@/src/project/project.js';

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
    private readonly spinner: SpinnerService
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
      const root = args.project = await Project.searchProjectRoot(args.project);

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
