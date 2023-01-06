import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { type IMiddleware, Middleware } from '@/src/bases/middleware';
import { SpinnerService } from '@/src/commons/spinner.service';
import { container } from '@/src/inversify.config';
import { CURRENT } from '@/src/project/constants';
import { Project, type PackageManager } from '@/src/project/project';
import { defineMiddleware } from '@/src/utils/yargs';

// Types
export interface ILoadProjectArgs {
  project: string;
  ['package-manager']?: PackageManager;
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
  builder(yargs: Argv) {
    return yargs
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

/** @deprecated */
export const loadProject = defineMiddleware({
  builder: (yargs) => yargs
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
    }),
  async handler(args) {
    const spinner = container.get(SpinnerService);

    try {
      spinner.spin('Loading project ...');
      const root = args.project = await Project.searchProjectRoot(args.project);

      container.bind(Project)
        .toDynamicValue(() => new Project(root, {
          packageManager: args.packageManager
        }))
        .whenTargetNamed(CURRENT);
    } finally {
      spinner.stop();
    }
  }
});
