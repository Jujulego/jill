import { asyncScope$, inject$ } from '@kyrielle/injector';
import { type ArgumentsCamelCase, type Argv } from 'yargs';
import type { Workspace } from '../projects/workspace.js';
import { CWD, LOGGER } from '../tokens.js';
import { ClientError } from '../errors.js';
import { loadProject, type ProjectArgs, withProject } from './project.js';

/**
 * Adds arguments to load a workspace.
 */
export function withWorkspace<T = unknown>(parser: Argv<T>): Argv<T & WorkspaceArgs> {
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
export async function loadWorkspace(args: ArgumentsCamelCase<WorkspaceArgs>): Promise<Workspace> {
  const logger = inject$(LOGGER);
  const project = loadProject(args);
  let workspace: Workspace | null;

  if (args.workspace) {
    logger.debug(`loading workspace "${args.workspace}"`);
    workspace = await project.workspace(args.workspace);
  } else if (inject$(CWD, asyncScope$()).startsWith(project.root)) {
    logger.debug('loading workspace containing current directory');
    workspace = await project.currentWorkspace(inject$(CWD, asyncScope$()));
  } else {
    logger.debug('loading main workspace');
    workspace = await project.mainWorkspace();
  }

  if (!workspace) {
    throw new WorkspaceNotFound(args.workspace || '.');
  }

  return workspace;
}

// Types
export interface WorkspaceArgs extends ProjectArgs {
  readonly workspace: string | undefined;
}

export class WorkspaceNotFound extends ClientError {
  name = 'WorkspaceNotFound';

  constructor(workspace: string) {
    super(`Workspace "${workspace}" not found`);
  }
}