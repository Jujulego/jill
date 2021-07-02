import { Project } from '@jujulego/jill-core';
import { Arguments } from 'yargs';

import { logger } from './logger';

// Types
export interface CommonArgs extends Arguments {
  project: string;
  verbose: number;
  '--'?: (string | number)[];
}

// Wrapper
export function commandHandler<A extends CommonArgs = CommonArgs>(handler: (project: Project, argv: A) => Promise<void>) {
  return async function (argv: A): Promise<void> {
    // Setup
    if (argv.verbose === 1) {
      logger.level = 'verbose';
    } else if (argv.verbose >= 2) {
      logger.level = 'debug';
    }

    if (!argv.project) {
      argv.project = await Project.searchProjectRoot(process.cwd());
    }

    const prj = new Project(argv.project);

    // Run command
    try {
      await handler(prj, argv);
    } catch (error) {
      logger.fail(error);
      process.exit(1);
    }
  };
}
