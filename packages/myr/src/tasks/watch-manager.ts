import { logger } from '@jujulego/jill-core';

import { WatchTask } from './watch-task';

// Class
export class WatchManager {
  // Attributes
  private readonly _tasks = new Map<string, WatchTask>();
  private readonly _logger = logger.child({ context: 'WatchManager' });

  // Methods
  get(id: string): WatchTask | null {
    return this._tasks.get(id) || null;
  }

  spawn(cwd: string, cmd: string, args: readonly string[]): WatchTask {
    const id = WatchTask.generateTaskId(cwd, cmd, args);
    let task = this.get(id);

    if (task && ['ready', 'running'].includes(task.status)) {
      this._logger.info(`Task ${id} already running`);
    } else {
      task = new WatchTask(cwd, cmd, args, { logger: logger.child({ task: id }) });
      task.start();

      this._tasks.set(id, task);
      this._logger.info(`Task ${id} spawned`);
    }

    return task;
  }

  kill(id: string): WatchTask | null {
    const task = this.get(id);

    if (task) {
      task.stop();
      this._logger.info(`Task ${id} killed`);
    }

    return task;
  }

  // Properties
  get tasks(): readonly WatchTask[] {
    return Array.from(this._tasks.values());
  }
}