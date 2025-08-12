import { inject$ } from '@kyrielle/injector';
import symbols from 'log-symbols';
import process from 'node:process';
import { type ArgumentsCamelCase, type Argv } from 'yargs';
import type { Workspace } from '../../projects/workspace.js';
import { LOGGER } from '../../tokens.js';
import { loadProject, type LoadProjectArgs, withProject } from './load-project.middleware.js';

/**
 * Adds arguments to load a workspace.
 */
export function withWorkspace<T = unknown>(parser: Argv<T>): Argv<T & LoadWorkspaceArgs> {
  return withProject(parser)
    .option('workspace', {
      alias: 'w',
      type: 'string',
      desc: 'Workspace to use'
    });
}

/**
 * Loads a workspace, based on arguments.
 */
export async function loadWorkspace(args: ArgumentsCamelCase<LoadWorkspaceArgs>): Promise<Workspace> {
  const logger = inject$(LOGGER);
  const project = loadProject(args);
  let workspace: Workspace | null;

  if (args.workspace) {
    logger.debug(`loading workspace "${args.workspace}"`);
    workspace = await project.workspace(args.workspace);
  } else if (process.cwd().startsWith(project.root)) {
    logger.debug('loading workspace containing current directory');
    workspace = await project.currentWorkspace(process.cwd());
  } else {
    logger.debug('loading main workspace');
    workspace = await project.mainWorkspace();
  }

  if (!workspace) {
    throw new Error(`'${symbols.error} workspace "${args.workspace || '.'}" not found'`);
  }

  return workspace;
}

// Types
export interface LoadWorkspaceArgs extends LoadProjectArgs {
  readonly workspace: string | undefined;
}
