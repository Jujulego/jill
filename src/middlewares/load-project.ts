import { container, CURRENT, SpinnerService } from '../services';
import { PackageManager, Project } from '../project';
import { defineMiddleware } from '../utils';

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
      choices: ['yarn', 'npm'],
      default: undefined as PackageManager | undefined,
      description: 'Force package manager'
    }),
  async handler(args) {
    const spinner = container.get(SpinnerService);

    try {
      spinner.spin('Loading project ...');
      const root = args.project = await Project.searchProjectRoot(args.project);

      container.bind(Project)
        .toDynamicValue(() => new Project(root, {
          packageManager: args['package-manager']
        }))
        .whenTargetNamed(CURRENT);
    } finally {
      spinner.stop();
    }
  }
});
