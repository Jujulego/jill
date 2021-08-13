import * as cp from 'child_process';
import * as path from 'path';

// Constants
export const MAIN = path.join(__filename, '../../bin/jill.js');
export const MOCK = path.join(__filename, '../../../../mock');

// Type
export interface SpawnResult {
  stdout: string[];
  stderr: string[];
  code: number;
}

export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string>;
}

// Utils
export function jill(args: ReadonlyArray<string>, opts: SpawnOptions = {}): Promise<SpawnResult> {
  return new Promise<SpawnResult>((resolve, reject) => {
    const proc = cp.spawn('node', [MAIN, ...args], {
      cwd: opts.cwd,
      shell: true,
      stdio: 'pipe'
    });

    // Gather result
    const res: SpawnResult = {
      stdout: [],
      stderr: [],
      code: 0
    };

    proc.stdout.on('data', (msg: Buffer) => {
      res.stdout.push(...msg.toString('utf-8').replace(/\n$/, '').split('\n'));
    });

    proc.stderr.on('data', (msg: Buffer) => {
      res.stderr.push(...msg.toString('utf-8').replace(/\n$/, '').split('\n'));
    });

    // Emit result
    proc.on('close', (code) => {
      res.code = code || 0;
      resolve(res);
    });
  });
}