import { Project } from '@/src/project/project';
import { container, CURRENT } from '@/src/inversify.config';
import { SpinnerService } from '@/src/commons/spinner.service';
import { defineMiddleware } from '@/src/utils/yargs';

// Middleware
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
