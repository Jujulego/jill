import { SpawnTask, SpawnTaskOption } from './tasks';
import { TaskManager } from './task-manager';

// Types
export interface GitOptions extends SpawnTaskOption {
  manager?: TaskManager;
}

// Git commands
export const git = {
  // commons
  command(cmd: string, args: string[], opts: GitOptions = {}): SpawnTask {
    const { manager = TaskManager.global } = opts;

    // Create task
    const task = new SpawnTask('git', [cmd, ...args], opts);
    manager.add(task);

    return task;
  },

  // commands
  branch(args: string[], opts: GitOptions = {}): SpawnTask {
    return this.command('branch', args, opts);
  },

  diff(args: string[], opts: GitOptions = {}): SpawnTask {
    return this.command('diff', args, opts);
  },

  tag(args: string[], opts: GitOptions = {}): SpawnTask {
    return this.command('tag', args, opts);
  },

  // high level
  async listBranches(args: string[] = [], opts: GitOptions = {}): Promise<string[]> {
    const task = this.branch(['-l', ...args], opts);
    const result: string[] = [];

    for await (const line of task.stdout()) {
      result.push(line);
    }

    return result;
  },

  async listTags(args: string[] = [], opts: GitOptions = {}): Promise<string[]> {
    const task = this.tag(['-l', ...args], opts);
    const result: string[] = [];

    for await (const line of task.stdout()) {
      result.push(line);
    }

    return result;
  }
};