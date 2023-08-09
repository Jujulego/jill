import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { ContextService } from '@/src/commons/context.service.ts';
import { SpinnerService } from '@/src/commons/spinner.service.ts';
import { CURRENT } from '@/src/constants.ts';
import { container, lazyInjectNamed } from '@/src/inversify.config.ts';
import { type IMiddleware, Middleware } from '@/src/modules/middleware.ts';
import { type Project } from '@/src/project/project.ts';
import { Workspace } from '@/src/project/workspace.ts';
import { ExitException } from '@/src/utils/exit.ts';

import { ILoadProjectArgs, LazyCurrentProject } from './load-project.ts';

// Types
export interface ILoadWorkspaceArgs extends ILoadProjectArgs {
  workspace?: string;
}

// Middleware
@Middleware()
export class LoadWorkspace implements IMiddleware<ILoadWorkspaceArgs> {
  // Lazy injections
  @LazyCurrentProject()
  readonly project: Project;

  // Constructor
  constructor(
    @inject(SpinnerService)
    private readonly spinner: SpinnerService,
    @inject(ContextService)
    private readonly context: ContextService,
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
    try {
      this.spinner.spin(`Loading "${args.workspace || '.'}" workspace ...`);

      let workspace = this.context.workspace ?? null;

      if (!workspace || args.workspace) {
        if (args.workspace) {
          workspace = await this.project.workspace(args.workspace);
        } else if (this.project.root.startsWith(process.cwd())) {
          workspace = await this.project.currentWorkspace();
        } else {
          workspace = await this.project.mainWorkspace();
        }
      }

      if (!workspace) {
        this.spinner.failed(`Workspace "${args.workspace || '.'}" not found`);
        throw new ExitException(1, 'Workspace not found');
      } else {
        this.context.workspace = workspace;
      }
    } finally {
      this.spinner.stop();
    }
  }
}

// Decorators
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
