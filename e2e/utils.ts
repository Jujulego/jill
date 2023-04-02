import cp from 'node:child_process';
import path from 'node:path';

import { InkScreen } from '@/tools/ink-screen';
import { type PackageManager } from '@/src/project/types';
import { splitCommandLine } from '@/src/utils/string';

// Constants
export const MAIN = path.join(__dirname, '../bin/jill.js');

// Type
export interface SpawnResult {
  stdout: string[];
  screen: InkScreen;
  code: number;
}

export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string>;
  removeCotes?: boolean;
}

// Utils
export function jill(args: string, opts: SpawnOptions = {}): Promise<SpawnResult> {
  return new Promise<SpawnResult>((resolve, reject) => {
    let argv = splitCommandLine(args);

    if (!opts.removeCotes) {
      argv = argv.map(arg => arg.replace(/^["'](.+)["']$/, '$1'));
    }

    const proc = cp.fork(MAIN, argv, {
      cwd: opts.cwd,
      stdio: 'overlapped',
      env: process.env
    });

    // Gather result
    const res: SpawnResult = {
      stdout: [],
      screen: new InkScreen(),
      code: 0
    };

    proc.stdout?.on('data', (msg: Buffer) => {
      res.stdout.push(...msg.toString('utf-8').replace(/\n$/, '').split('\n'));
    });

    proc.stderr?.pipe(res.screen);

    // Emit result
    proc.on('close', (code) => {
      res.code = code || 0;
      resolve(res);
    });

    proc.on('error', reject);
  });
}

export function withPackageManager(cb: (pm: PackageManager) => void) {
  let managers: PackageManager[] = ['npm', 'yarn'];

  if (process.env.USE_PACKAGE_MANAGER) {
    const toUse = process.env.USE_PACKAGE_MANAGER.split(/, ?/g);
    managers = managers.filter((pm) => toUse.includes(pm));
  }

  for (const pm of managers) {
    describe(`using ${pm}`, () => {
      cb(pm);
    });
  }
}
