import { Argv } from 'yargs';

import { container, CURRENT_PROJECT, SpinnerService } from '../services';
import { PackageManager, Project } from '../project';
import { inkApp } from './ink-app';

// Middleware
export function currentProject<T>(yargs: Argv<T>) {
  return inkApp(yargs)
    .option('project', {
      alias: 'p',
      type: 'string',
      default: process.cwd(),
      description: 'Project root directory'
    })
    .option('package-manager', {
      choices: ['yarn', 'npm'],
      default: undefined as PackageManager | undefined,
      type: 'string',
      description: 'Force package manager'
    })
    .middleware(async (args) => {
      const spinner = container.get(SpinnerService);

      try {
        spinner.spin('Loading project ...');

        const root = args.project = await Project.searchProjectRoot(args.project);
        await new Promise((resolve) => setTimeout(resolve, 5000));

        container.bind(CURRENT_PROJECT)
          .toDynamicValue(() => new Project(root, {
            packageManager: args['package-manager']
          }));
      } finally {
        spinner.stop();
      }
    });
}
