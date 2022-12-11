import { ILogger } from '@jujulego/tasks';
import cp from 'node:child_process';

// Logger
export const spyLogger: ILogger = {
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Utils
export function flushPromises(timeout = 0): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, timeout));
}

export interface ShellOptions {
  cwd?: string;
}

export function shell(cmd: string, args: string[], opts: ShellOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = cp.spawn(cmd, args, {
      cwd: opts.cwd,
      shell: true,
      windowsHide: true
    });

    let stdout = '';

    proc.stdout.on('data', (msg: Buffer) => {
      stdout = stdout + msg.toString('utf-8');
    });

    proc.on('close', (code) => {
      if (code) {
        reject(new Error(`yarn failed with code ${code}:\n${stdout}`));
      } else {
        resolve();
      }
    });

    proc.on('error', reject);
  });
}
