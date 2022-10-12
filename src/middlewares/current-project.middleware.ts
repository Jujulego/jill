import { Argv } from 'yargs';

import { container, CURRENT_PROJECT } from '../services';
import { PackageManager, Project } from '../project';

// Middleware
export function currentProject<T>(yargs: Argv<T>) {
  return yargs
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
      const root = args.project = await Project.searchProjectRoot(args.project);

      container.bind(CURRENT_PROJECT)
        .toDynamicValue(() => new Project(root, {
          packageManager: args['package-manager']
        }));
    });
}
