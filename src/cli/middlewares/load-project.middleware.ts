import { inject$ } from '@kyrielle/injector';
import { type ArgumentsCamelCase, type Argv } from 'yargs';
import { ProjectsRepository } from '../../projects/projects.repository.js';
import type { PackageManager, Writable } from '../../utils/types.js';

/**
 * Loads a project.
 */
export function loadProject<T = unknown>(parser: Argv<T>): Argv<T & LoadProjectArgs> {
  return parser
    .option('project', {
      alias: 'p',
      type: 'string',
      default: process.cwd(),
      description: 'Project root directory',
      normalize: true,
    })
    .option('package-manager', {
      choices: ['yarn', 'npm'] as const,
      type: 'string',
      description: 'Force package manager'
    })
    .middleware(async (args: ArgumentsCamelCase<Writable<LoadProjectArgs>>) => {
      const repository = inject$(ProjectsRepository);
      args.project = await repository.searchProjectRoot(args.project);
    });
}

// Types
export interface LoadProjectArgs {
  readonly project: string;
  readonly 'package-manager': PackageManager | undefined;
}
