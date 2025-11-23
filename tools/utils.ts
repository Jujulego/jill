import { splitCommandLine } from '@/src/utils/string.js';
import cp from 'node:child_process';
import { ESC } from './ink-screen.js';

// Utils
export function noColor(str = ''): string {
  return str.replace(new RegExp(`${ESC}\\[(\\d{1,2};)*\\d{1,2}m`, 'g'), '');
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
