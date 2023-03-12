import { ParallelGroup, SpawnTask, type TaskContext } from '@jujulego/tasks';

// Classes
export class TestParallelGroup<C extends TaskContext = TaskContext> extends ParallelGroup<C> {
  // Methods
  readonly emit = this._groupEvents.emit;
}

export class TestSpawnTask<C extends TaskContext = TaskContext> extends SpawnTask<C> {
  // Methods
  readonly emit = this._spawnEvents.emit;
}
