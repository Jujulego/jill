import { ContextService } from '@/src/commons/context.service.js';
import { CURRENT } from '@/src/constants.js';
import { container, lazyInjectNamed } from '@/src/inversify.config.js';
import { type IMiddleware, Middleware } from '@/src/modules/middleware.js';
import { type Project } from '@/src/project/project.js';
import { Workspace } from '@/src/project/workspace.js';
import { ExitException } from '@/src/utils/exit.js';
import { Logger } from '@jujulego/logger';
import { inject } from 'inversify';
import symbols from 'log-symbols';
import { type ArgumentsCamelCase, type Argv } from 'yargs';
import { ILoadProjectArgs, LazyCurrentProject } from './load-project.js';

// Types
/** @deprecated */
export interface ILoadWorkspaceArgs extends ILoadProjectArgs {
  workspace?: string;
}

// Middleware
/** @deprecated */
@Middleware()
export class LoadWorkspace implements IMiddleware<ILoadWorkspaceArgs> {
  // Lazy injections
  @LazyCurrentProject()
  readonly project: Project;

  // Constructor
  constructor(
    @inject(ContextService)
    private readonly context: ContextService,
    @inject(Logger)
    private readonly logger: Logger,
  ) {}

  // Methods
  builder(parser: Argv) {
    return parser
      .option('workspace', {
        alias: 'w',
        type: 'string',
        desc: 'Workspace to use'
      });
  }

  async handler(args: ArgumentsCamelCase<ILoadWorkspaceArgs>): Promise<void> {
    let workspace = this.context.workspace ?? null;

    if (!workspace || args.workspace) {
      if (args.workspace) {
        workspace = await this.project.workspace(args.workspace);
      } else if (process.cwd().startsWith(this.project.root)) {
        workspace = await this.project.currentWorkspace();
      } else {
        workspace = await this.project.mainWorkspace();
      }
    }

    if (!workspace) {
      this.logger.error(`${symbols.error} Workspace "${args.workspace || '.'}" not found`);
      throw new ExitException(1, 'Workspace not found');
    } else {
      this.context.workspace = workspace;
    }
  }
}

// Decorators
/** @deprecated */
export function LazyCurrentWorkspace() {
  return lazyInjectNamed(Workspace, CURRENT);
}

container.bind(Workspace)
  .toDynamicValue(({ container }) => {
    const ctx = container.get(ContextService);
    const wks = ctx.workspace;

    if (!wks) {
      throw new Error('Cannot inject current workspace, it not yet defined');
    }

    return wks;
  })
  .whenTargetNamed(CURRENT);
