import { PackageManager, Project } from '@jujulego/jill-core';
import type { Arguments } from 'yargs';

import { logger } from './logger';

// Types
export interface CommonArgs {
  project?: string;
  'package-manager'?: PackageManager;
  verbose: number;
}

export type CommandHandler<A = Record<string, never>> = (project: Project, argv: A) => Promise<number | void>

// Wrapper
export function commandHandler<A = Record<string, never>>(handler: CommandHandler<A>) {
  return async function (argv: Arguments<A & CommonArgs>): Promise<void> {
    // Setup
    if (argv.verbose === 1) {
      logger.level = 'verbose';
    } else if (argv.verbose >= 2) {
      logger.level = 'debug';
    }

    if (!argv.project) {
      argv.project = await Project.searchProjectRoot(process.cwd());
    }

    const prj = new Project(argv.project, { packageManager: argv['package-manager'] });

    // Run command
    try {
      process.exit(await handler(prj, argv) || 0);
    } catch (error) {
      logger.fail(error);
      process.exit(1);
    }
  };
}
