import { SpawnTask, SpawnTaskOptions, TaskContext, TaskManager } from '@jujulego/tasks';

import { globalTaskManager } from './tasks';

// Types
export interface GitOptions extends SpawnTaskOptions {
  manager?: TaskManager<any>;
}

export interface GitContext extends TaskContext {
  command: string;
}

// Git commands
export const git = {
  // commons
  command(cmd: string, args: string[], opts: GitOptions = {}): SpawnTask<GitContext> {
    const { manager = globalTaskManager } = opts;

    // Create task
    const task = new SpawnTask('git', [cmd, ...args], { command: cmd }, opts);
    manager.add(task);

    return task;
  },

  // commands
  branch(args: string[], opts?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('branch', args, opts);
  },

  diff(args: string[], opts?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('diff', args, opts);
  },

  tag(args: string[], opts?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('tag', args, opts);
  },

  // high level
  async listBranches(args: string[] = [], opts?: SpawnTaskOptions): Promise<string[]> {
    const task = this.branch(['-l', ...args], opts);
    const result: string[] = [];

    for await (const line of task.stdout()) {
      result.push(line);
    }

    return result;
  },

  async listTags(args: string[] = [], opts?: SpawnTaskOptions): Promise<string[]> {
    const task = this.tag(['-l', ...args], opts);
    const result: string[] = [];

    for await (const line of task.stdout()) {
      result.push(line);
    }

    return result;
  }
};
