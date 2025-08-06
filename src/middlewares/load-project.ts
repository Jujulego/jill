import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { CURRENT } from '@/src/constants.js';
import { ContextService } from '@/src/commons/context.service.js';
import { container, lazyInjectNamed } from '@/src/inversify.config.js';
import { type IMiddleware, Middleware } from '@/src/modules/middleware.js';
import { Project } from '@/src/project/project.js';
import { ProjectRepository } from '@/src/project/project.repository.js';
import { type PackageManager } from '@/src/utils/types.js';

// Types
export interface ILoadProjectArgs {
  project?: string;
  'package-manager'?: PackageManager;
}

// Middleware
/** @deprecated */
@Middleware()
export class LoadProject implements IMiddleware<ILoadProjectArgs> {
  // Constructor
  constructor(
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
      args.project = await this.projects.searchProjectRoot(args.project ?? process.cwd());

      this.context.project = this.projects.getProject(args.project, {
        packageManager: args.packageManager
      });
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
