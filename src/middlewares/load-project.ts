import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { ContextService } from '@/src/commons/context.service';
import { SpinnerService } from '@/src/commons/spinner.service';
import { CURRENT } from '@/src/constants';
import { container, lazyInjectNamed } from '@/src/inversify.config';
import { type IMiddleware, Middleware } from '@/src/modules/middleware';
import { Project } from '@/src/project/project';
import { ProjectRepository } from '@/src/project/project.repository';
import { type PackageManager } from '@/src/project/types';

// Types
export interface ILoadProjectArgs {
  project?: string;
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
    @inject(ContextService)
    private readonly context: ContextService,
  ) {}

  // Methods
  builder(parser: Argv) {
    return parser
      .option('project', {
        alias: 'p',
        type: 'string',
        description: 'Project root directory'
      })
      .option('package-manager', {
        choices: ['yarn', 'npm'] as const,
        type: 'string',
        description: 'Force package manager'
      });
  }

  async handler(args: ArgumentsCamelCase<ILoadProjectArgs>): Promise<void> {
    if (!this.context.project || args.project) {
      try {
        this.spinner.spin('Loading project ...');

        args.project = await this.projects.searchProjectRoot(args.project ?? process.cwd());

        this.context.project = this.projects.getProject(args.project, {
          packageManager: args.packageManager
        });
      } finally {
        this.spinner.stop();
      }
    } else {
      args.project = this.context.project.root;
    }
  }
}

// Lazy injection
export function LazyCurrentProject() {
  return lazyInjectNamed(Project, CURRENT);
}

container.bind(Project)
  .toDynamicValue(({ container }) => {
    const ctx = container.get(ContextService);
    const prj = ctx.project;

    if (!prj) {
      throw new Error('Cannot inject current project, it not yet defined');
    }

    return prj;
  })
  .whenTargetNamed(CURRENT);
