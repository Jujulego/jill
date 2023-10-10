import cp from 'node:child_process';
import path from 'node:path';

import { InkScreen } from '@/tools/ink-screen.js';
import { splitCommandLine } from '@/src/utils/string.js';

// Constants
export const MAIN = path.join(__dirname, '../bin/jill.mjs');

// Type
export interface SpawnResult {
  screen: InkScreen;
  stdout: string[];
  stderr: string[];
  code: number;
}

export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string>;
  keepQuotes?: boolean;
}

// Utils
export function jill(args: string, opts: SpawnOptions = {}): Promise<SpawnResult> {
  return new Promise<SpawnResult>((resolve, reject) => {
    let argv = splitCommandLine(args);

    if (!opts.keepQuotes) {
      argv = argv.map(arg => arg.replace(/^["'](.+)["']$/, '$1'));
    }

    const proc = cp.fork(MAIN, argv, {
      cwd: opts.cwd,
      stdio: 'overlapped',
      env: process.env
    });

    // Gather result
    const res: SpawnResult = {
      screen: new InkScreen(),
      stdout: [],
      stderr: [],
      code: 0
    };

    proc.stdout?.pipe(res.screen);

    proc.stdout?.on('data', (msg: Buffer) => {
      res.stdout.push(...msg.toString('utf-8').replace(/\n$/, '').split('\n'));
    });

    proc.stderr?.on('data', (msg: Buffer) => {
      res.stderr.push(...msg.toString('utf-8').replace(/\n$/, '').split('\n'));
    });

    // Emit result
    proc.on('close', (code) => {
      res.code = code || 0;
      resolve(res);
    });

    proc.on('error', reject);
  });
}
