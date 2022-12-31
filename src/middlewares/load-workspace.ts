import yargs from 'yargs';

import { Project, Workspace } from '@/src/project';
import { container, CURRENT } from '@/src/services/inversify.config';
import { SpinnerService } from '@/src/services/spinner.service';
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
        container.bind(Workspace)
          .toConstantValue(workspace)
          .whenTargetNamed(CURRENT);
      }
    } finally {
      spinner.stop();
    }
  }
});
