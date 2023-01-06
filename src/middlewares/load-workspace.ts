import yargs from 'yargs';

import { SpinnerService } from '@/src/commons/spinner.service';
import { container } from '@/src/inversify.config';
import { Project } from '@/src/project/project';
import { CURRENT } from '@/src/project/constants';
import { Workspace } from '@/src/project/workspace';
import { defineMiddleware } from '@/src/utils/yargs';

// Middleware
export const loadWorkspace = defineMiddleware({
  builder: (yargs) => yargs
    .option('workspace', {
      alias: 'w',
      type: 'string',
      desc: 'Workspace to use'
    }),
  async handler(args): Promise<void> {
    const spinner = container.get(SpinnerService);
    const project = container.getNamed(Project, CURRENT);

    try {
      spinner.spin(`Loading "${args.workspace || '.'}" workspace ...`);
      const workspace = await project.workspace(args.workspace);

      if (!workspace) {
        spinner.failed(`Workspace "${args.workspace || '.'}" not found`);
        yargs.exit(1, new Error('Workspace not found'));
      } else {
        container
          .bind(Workspace)
          .toConstantValue(workspace)
          .whenTargetNamed(CURRENT);
      }
    } finally {
      spinner.stop();
    }
  }
});
