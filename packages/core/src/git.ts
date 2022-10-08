import { SpawnTask, SpawnTaskOptions, TaskContext } from '@jujulego/tasks';

import { logger } from './logger';
import { manager } from './tasks';
import { streamLines } from './utils';

// Types
export interface GitContext extends TaskContext {
  command: string;
}

// Git commands
export class Git {
  // commons
  static command(cmd: string, args: string[], opts: SpawnTaskOptions = {}): SpawnTask<GitContext> {
    // Create task
    const task = new SpawnTask('git', [cmd, ...args], { command: cmd }, { logger, ...opts });
    task.subscribe('stream', ({ data }) => logger.debug(data.toString('utf-8')));

    manager.add(task);

    return task;
  }

  // commands
  static branch(args: string[], opts?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('branch', args, opts);
  }

  static diff(args: string[], opts?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('diff', args, opts);
  }

  static tag(args: string[], opts?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('tag', args, opts);
  }

  // high level
  static isAffected(base: string, args: string[] = [], opts?: SpawnTaskOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const task = this.diff(['--quiet', base, ...args], opts);

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
      result.push(line);
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
