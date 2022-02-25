import { logger } from '@jujulego/jill-core';
import { Injectable } from '@nestjs/common';

import { SpawnTaskMode } from '../../common';
import { WatchTask } from './watch-task.model';

// Class
@Injectable()
export class WatchManager {
  // Attributes
  private readonly _tasks = new Map<string, WatchTask>();
  private readonly _logger = logger.child({ context: 'WatchManager' });

  // Methods
  private _spawnTree(task: WatchTask): void {
    this._logger.verbose(`Starting task ${task.id} ...`);

    // Start watch deps
    for (const tsk of task.watchOn) {
      if (tsk.status === 'ready') {
        if (tsk.mode === SpawnTaskMode.AUTO) {
          this._spawnTree(tsk);
          this._logger.verbose(`Watch dependency ${tsk.id} of (${task.id}) spawned`);
        } else {
          throw new Error(`Cannot start ${task.id}, ${tsk.id} is ready but is not in auto mode`);
        }
      } else if (tsk.status !== 'running') {
        throw new Error(`Cannot start ${task.id}, ${tsk.id} is ${tsk.status}`);
      }
    }

    // Start task it self
    task.start();
  }

  get(id: string): WatchTask | null {
    return this._tasks.get(id) || null;
  }

  spawn(cwd: string, cmd: string, args: readonly string[], mode: SpawnTaskMode, watchOn: readonly string[]): WatchTask {
    const id = WatchTask.generateId(cwd, cmd, args);
    let task = this.get(id);

    if (task && ['ready', 'running'].includes(task.status)) {
      this._logger.info(`Task ${id} already exists`);
    } else {
      // Create task
      task = new WatchTask(cwd, cmd, args, mode, { logger: logger.child({ task: id }) });

      for (const id of watchOn) {
        const dep = this.get(id);

        if (dep) {
          task.watch(dep);
        } else {
          throw Error(`Watch dependency ${id} not found`);
        }
      }

      this._tasks.set(id, task);

      // Start task if required
      if (mode !== SpawnTaskMode.AUTO) {
        this._spawnTree(task);
        this._logger.info(`Task ${id} spawned`);
      } else {
        this._logger.info(`Task ${id} created`);
      }
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
