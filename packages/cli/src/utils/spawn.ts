import * as cp from 'child_process';

import { logger, OraLogger } from '../logger';

// Type
export interface SpawnResult {
  stdout: string[];
  stderr: string[];
}

export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string>;
  logger?: OraLogger;
}

// Utils
export function spawn(cmd: string, args: ReadonlyArray<string>, opts: SpawnOptions = {}): Promise<SpawnResult> {
  const log = opts.logger ?? logger;

  return new Promise<SpawnResult>((resolve, reject) => {
    log.debug(`Running ${[cmd, ...args].join(' ')}`);

    const proc = cp.spawn(cmd, args, {
      cwd: opts.cwd,
      shell: true,
      stdio: 'pipe',
      env: {
        ...process.env,
        ...opts.env
      }
    });

    // Gather result
    const res: SpawnResult = {
      stdout: [],
      stderr: []
    };

    proc.stdout.on('data', (msg: Buffer) => {
      res.stdout.push(...msg.toString('utf-8').replace(/\n$/, '').split('\n'));
    });

    proc.stderr.on('data', (msg: Buffer) => {
      res.stderr.push(...msg.toString('utf-8').replace(/\n$/, '').split('\n'));
    });

    // Emit result
    proc.on('close', (code) => {
      if (code) {
        reject(new Error(res.stderr[res.stderr.length - 1] || `${[cmd, ...args].join(' ')} failed`));
      } else {
        resolve(res);
      }
    });
  });
}