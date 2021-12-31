import { Injectable } from '@nestjs/common';
import { logger } from 'packages/core';

import { WatchTask } from './watch-task';

// Class
@Injectable()
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

  async kill(id: string): Promise<WatchTask | null> {
    const task = this.get(id);

    if (task && task.status === 'running') {
      task.stop();
      this._logger.info(`Killing task ${id}`);

      await task.waitFor('done', 'failed');
      this._logger.info(`Task ${id} killed`);
    }

    return task;
  }

  async killAll(): Promise<number> {
    const tasks: Promise<unknown>[] = [];

    for (const task of this._tasks.values()) {
      if (task.status === 'running') {
        task.stop();
        this._logger.info(`Killing task ${task.id}`);

        tasks.push((async () => {
          await task.waitFor('done', 'failed');
          this._logger.info(`Task ${task.id} killed`);
        })());
      }
    }

    await Promise.all(tasks);
    return tasks.length;
  }

  // Properties
  get tasks(): readonly WatchTask[] {
    return Array.from(this._tasks.values());
  }
}
