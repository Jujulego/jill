import { spawn$, type SpawnJob$, type SpawnProps } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import { type Logger, LogLevel } from '@kyrielle/logger';
import { type Workspace } from '../projects/workspace.js';
import { LOGGER } from '../tokens.js';
import { logStreamedLines } from '../utils/streams.js';

export function command$(
  workspace: Workspace,
  cmd: string,
  args: string[],
  opts: CommandOpts = {}
): SpawnJob$ {
  const { superCommand, logger = inject$(LOGGER), ...rest } = opts;

  // Apply super command
  if (superCommand) {
    if (typeof superCommand === 'string') {
      args = [cmd, ...args];
      cmd = superCommand;
    } else if (superCommand.length) {
      args = [...superCommand.slice(1), cmd, ...args];
      cmd = superCommand[0];
    }
  }

  // Prepare job
  const job = spawn$(cmd, args, {
    ...rest,
    cwd: workspace.root,
    env: {
      FORCE_COLOR: '1',
      ...rest.env,
    }
  });

  job.stdout.pipe(logStreamedLines(logger, LogLevel.info));
  job.stderr.pipe(logStreamedLines(logger, LogLevel.info));

  return job;
}

export interface CommandOpts extends Omit<SpawnProps, 'cwd'> {
  readonly logger?: Logger;
  readonly superCommand?: string | readonly string[];
}
