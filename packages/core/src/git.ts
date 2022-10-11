import { SpawnTask, SpawnTaskOptions, TaskContext } from '@jujulego/tasks';

import { logger } from './logger';
import { manager } from './task-manager.service';
import { streamLines } from './utils';

// Types
export interface GitContext extends TaskContext {
  command: string;
}

// Git commands
export class Git {
  // commons
  static command(cmd: string, args: string[], options: SpawnTaskOptions = {}): SpawnTask<GitContext> {
    const opts = { logger, ...options };

    // Create task
    const task = new SpawnTask('git', [cmd, ...args], { command: cmd }, opts);
    task.subscribe('stream', ({ data }) => opts.logger.debug(data.toString('utf-8')));

    manager.add(task);

    return task;
  }

  // commands
  static branch(args: string[], options?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('branch', args, options);
  }

  static diff(args: string[], options?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('diff', args, options);
  }

  static tag(args: string[], options?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('tag', args, options);
  }

  // high level
  static isAffected(reference: string, args: string[] = [], opts?: SpawnTaskOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const task = this.diff(['--quiet', reference, ...args], opts);

      task.subscribe('status.done', () => resolve(true));
      task.subscribe('status.failed', () => {
        if (task.exitCode) {
          resolve(false);
        } else {
          reject(new Error(`Task ${task.name} failed`));
        }
      });
    });
  }

  static async listBranches(args: string[] = [], opts?: SpawnTaskOptions): Promise<string[]> {
    const task = this.branch(['-l', ...args], opts);
    const result: string[] = [];

    for await (const line of streamLines(task, 'stdout')) {
      result.push(line.replace(/^[ *] /, ''));
    }

    return result;
  }

  static async listTags(args: string[] = [], opts?: SpawnTaskOptions): Promise<string[]> {
    const task = this.tag(['-l', ...args], opts);
    const result: string[] = [];

    for await (const line of streamLines(task, 'stdout')) {
      result.push(line);
    }

    return result;
  }
}
