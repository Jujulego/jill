import { spawn$, type SpawnJob$, type SpawnProps } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import type { Logger } from '@kyrielle/logger';
import { type Workspace } from '../../projects/workspace.js';
import { LOGGER } from '../../tokens.js';

export function command$(cmd: string, args: string[], props: CommandProps): SpawnJob$ {
  const { workspace, superCommand, logger = inject$(LOGGER), ...rest } = props;

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

  job.stdout.on('data', (data: Buffer) => logger.info(data.toString('utf-8').trimEnd()));
  job.stderr.on('data', (data: Buffer) => logger.info(data.toString('utf-8').trimEnd()));

  return job;
}

export interface CommandProps extends Omit<SpawnProps, 'cwd'> {
  readonly workspace: Workspace;

  readonly logger?: Logger;
  readonly superCommand?: string | readonly string[];
}