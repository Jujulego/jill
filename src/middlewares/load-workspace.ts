import { inject } from 'inversify';
import yargs, { type ArgumentsCamelCase, type Argv } from 'yargs';

import { SpinnerService } from '@/src/commons/spinner.service';
import { CURRENT } from '@/src/constants';
import { container } from '@/src/inversify.config';
import { type IMiddleware, Middleware } from '@/src/modules/middleware';
import { type Project } from '@/src/project/project';
import { Workspace } from '@/src/project/workspace';

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
    @inject(SpinnerService)
    private readonly spinner: SpinnerService
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
      const workspace = await this.project.workspace(args.workspace);

      if (!workspace) {
        this.spinner.failed(`Workspace "${args.workspace || '.'}" not found`);
        yargs.exit(1, new Error('Workspace not found'));
      } else {
        container
          .bind(Workspace)
          .toConstantValue(workspace)
          .whenTargetNamed(CURRENT);
      }
    } finally {
      this.spinner.stop();
    }
  }
}
