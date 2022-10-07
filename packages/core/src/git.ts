import { SpawnTask, SpawnTaskOptions, TaskContext, TaskManager } from '@jujulego/tasks';

import { logger } from './logger';
import { globalTaskManager } from './tasks';
import { streamLines } from './utils';

// Types
export interface GitOptions extends SpawnTaskOptions {
  manager?: TaskManager<GitContext>;
}

export interface GitContext extends TaskContext {
  command: string;
}

// Git commands
export class Git {
  // commons
  static command(cmd: string, args: string[], opts: GitOptions = {}): SpawnTask<GitContext> {
    const { manager = globalTaskManager } = opts;

    // Create task
    const task = new SpawnTask('git', [cmd, ...args], { command: cmd }, { logger, ...opts });
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
