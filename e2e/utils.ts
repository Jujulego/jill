import * as cp from 'child_process';
import * as path from 'path';

// Constants
export const MAIN = path.join(__filename, '../../packages/cli/bin/jill.js');
export const MOCK = path.join(__filename, '../../mock');
export const ROOT = path.join(__filename, '../../');

const INK_NEW_FRAME = '\u001b[2K\u001b[1A\u001b[2K\u001b[G';

// Type
export interface SpawnResult {
  lastFrame: string[];
  frames: string[][];
  stderr: string[];
  code: number;
}

export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string>;
}

// Utils
export function jill(args: ReadonlyArray<string>, opts: SpawnOptions = {}): Promise<SpawnResult> {
  return new Promise<SpawnResult>((resolve) => {
    const proc = cp.spawn('node', [MAIN, ...args], {
      cwd: opts.cwd,
      shell: true,
      stdio: 'pipe',
      env: process.env
    });

    // Gather result
    const res: SpawnResult = {
      lastFrame: [],
      frames: [],
      stderr: [],
      code: 0
    };

    proc.stdout.on('data', (msg: Buffer) => {
      const frames = msg.toString('utf-8')
        .split(INK_NEW_FRAME)
        .filter(f => f && f !== '\n');

      // New frames
      for (const frame of frames) {
        res.frames.push(frame.replace(/\n$/, '').split('\n'));
      }

      res.lastFrame = res.frames[res.frames.length - 1];
    });

    proc.stderr.on('data', (msg: Buffer) => {
      const data = msg.toString('utf-8').replace(/\r?\n$/, '');
      res.stderr.push(...data.split(/\r?\n/));
    });

    // Emit result
    proc.on('close', (code) => {
      res.code = code || 0;
      resolve(res);
    });
  });
}
