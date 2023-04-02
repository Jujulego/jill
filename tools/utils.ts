import { type ILogger } from '@jujulego/tasks';
import type ink from 'ink';
import { type render } from 'ink-testing-library';
import cp from 'node:child_process';
import fs from 'node:fs/promises';

import { splitCommandLine } from '@/src/utils/string';

import { ESC } from './ink-screen';

// Logger
export const spyLogger: ILogger = {
  debug: jest.fn(),
  verbose: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Ink
export function wrapInkTestApp(app: ReturnType<typeof render>): ink.Instance {
  return {
    ...app,
    waitUntilExit: jest.fn() as ink.Instance['waitUntilExit'],
    clear: jest.fn() as ink.Instance['clear'],
  } as ink.Instance;
}

// Utils
export function noColor(str = ''): string {
  return str.replace(new RegExp(`${ESC}\\[(\\d{1,2};)*\\d{1,2}m`, 'g'), '');
}

export function flushPromises(timeout = 0): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, timeout));
}

export async function fileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }

    throw err;
  }
}

export interface ShellOptions {
  cwd?: string;
}

export function shell(line: string, opts: ShellOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = splitCommandLine(line);
    const proc = cp.spawn(cmd, args, {
      cwd: opts.cwd,
      shell: true,
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (msg: Buffer) => {
      stdout = stdout + msg.toString('utf-8');
    });

    proc.stderr.on('data', (msg: Buffer) => {
      stderr = stderr + msg.toString('utf-8');
    });

    proc.on('close', (code) => {
      if (code) {
        reject(new Error(`${cmd} failed with code ${code}:\n${stdout}\n${stderr}`));
      } else {
        resolve();
      }
    });

    proc.on('error', reject);
  });
}
