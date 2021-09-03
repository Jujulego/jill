import { SpawnTask, SpawnTaskOption } from './tasks';
import { TaskManager } from './task-manager';

// Types
export interface GitOptions extends SpawnTaskOption {
  manager?: TaskManager;
}

// Git commands
export const git = {
  diff(args: string[], opts: GitOptions = {}): SpawnTask {
    const { manager = TaskManager.global } = opts;

    // Create task
    const task = new SpawnTask('git', ['diff', ...args], opts);
    manager.add(task);

    return task;
  }
};