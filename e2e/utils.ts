import cp from 'node:child_process';
import path from 'node:path';

import { type PackageManager } from '@/src/project/project';

import { InkScreen } from '@/tools/ink-screen';

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
}

// Utils
export function jill(args: ReadonlyArray<string>, opts: SpawnOptions = {}): Promise<SpawnResult> {
  return new Promise<SpawnResult>((resolve, reject) => {
    const proc = cp.fork(MAIN, args, {
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

export function getPackageManager(): PackageManager {
  const val = process.env.USE_PACKAGE_MANAGER;

  if (val !== 'npm' && val !== 'yarn') {
    throw new Error('Invalid value in USE_PACKAGE_MANAGER env var');
  }

  return val;
}

export function usePackageManager(cb: (pm: PackageManager) => void) {
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