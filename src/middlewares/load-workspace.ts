import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { ContextService } from '@/src/commons/context.service';
import { SpinnerService } from '@/src/commons/spinner.service';
import { CURRENT } from '@/src/constants';
import { container, lazyInjectNamed } from '@/src/inversify.config';
import { type IMiddleware, Middleware } from '@/src/modules/middleware';
import { type Project } from '@/src/project/project';
import { Workspace } from '@/src/project/workspace';
import { ExitException } from '@/src/utils/exit';

import { LazyCurrentProject } from './load-project';

// Types
export interface ILoadWorkspaceArgs {
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
    private readonly spinner: SpinnerService,
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
        workspace = await this.project.workspace(args.workspace);
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
