import { logger$ } from '@jujulego/logger';
import { Instance } from 'ink';
import { type render } from 'ink-testing-library';
import { vi } from 'vitest';
import cp from 'node:child_process';

import { splitCommandLine } from '@/src/utils/string.js';

import { ESC } from './ink-screen.js';

// Logger
export const spyLogger = logger$();
vi.spyOn(spyLogger, 'debug');
vi.spyOn(spyLogger, 'verbose');
vi.spyOn(spyLogger, 'info');
vi.spyOn(spyLogger, 'warning');
vi.spyOn(spyLogger, 'error');

// Ink
export function wrapInkTestApp(app: ReturnType<typeof render>): Instance {
  return {
    ...app,
    waitUntilExit: vi.fn() as Instance['waitUntilExit'],
    clear: vi.fn() as Instance['clear'],
  } as Instance;
}

// Utils
export function noColor(str = ''): string {
  return str.replace(new RegExp(`${ESC}\\[(\\d{1,2};)*\\d{1,2}m`, 'g'), '');
}

export function flushPromises(timeout = 0): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, timeout));
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
