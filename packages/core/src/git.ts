import { SpawnTask, SpawnTaskOption } from './tasks';
import { TaskManager } from './task-manager';

// Types
export interface GitOptions extends SpawnTaskOption {
  manager?: TaskManager;
}

// Git commands
export const git = {
  async* diff(args: string[], opts: GitOptions = {}): AsyncGenerator<string, void> {
    const { manager = TaskManager.global } = opts;

    // Create task
    const task = new SpawnTask('git', ['diff', ...args], opts);
    manager.add(task);

    // Listen result
    for await (const data of task.stdout()) {
      for (const file of data.replace(/\n$/, '').split('\n')) {
        yield file;
      }
    }
  }
};