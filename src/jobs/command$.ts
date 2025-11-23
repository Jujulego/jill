import { inject$ } from '@kyrielle/injector';
import { type Logger, LogLevel } from '@kyrielle/logger';
import { spawn$, type SpawnJob$, type SpawnProps } from '@kyrielle/workload';
import { type Workspace } from '../projects/workspace.js';
import { LOGGER } from '../tokens.js';
import { logStreamedLines } from '../utils/streams.js';

export function command$(
  workspace: Workspace,
  cmd: string,
  opts: CommandOpts = {}
): SpawnJob$ {
  const { superCommand, logger = inject$(LOGGER), ...rest } = opts;

  // Apply super command
  if (superCommand) {
    cmd = superCommand + ' ' + cmd;
  }

  // Prepare job
  const job = spawn$(cmd, {
    ...rest,
    cwd: workspace.root,
    env: {
      FORCE_COLOR: '1',
      ...rest.env,
    },
    shell: true
  });

  job.stdout.pipe(logStreamedLines(logger, LogLevel.info));
  job.stderr.pipe(logStreamedLines(logger, LogLevel.info));

  return job;
}

export interface CommandOpts extends Omit<SpawnProps, 'cwd'> {
  readonly logger?: Logger;
  readonly superCommand?: string;
}
