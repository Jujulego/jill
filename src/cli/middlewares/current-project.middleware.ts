import { type Argv } from 'yargs';
import type { PackageManager } from '../../utils/types.js';

/**
 * Loads a projects.
 */
export function loadCurrentProject<T = unknown>(parser: Argv<T>): Argv<T & LoadProjectArgs> {
  return parser
    .option('project', {
      alias: 'p',
      type: 'string',
      description: 'Project root directory'
    })
    .option('package-manager', {
      choices: ['yarn', 'npm'] as const,
      type: 'string',
      description: 'Force package manager'
    })
    .middleware((args) => {
      console.log(args);
    });
}

// Types
export interface LoadProjectArgs {
  readonly project: string | undefined;
  readonly 'package-manager': PackageManager | undefined;
}
