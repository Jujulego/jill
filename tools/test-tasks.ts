import { ParallelGroup, SpawnTask, type TaskContext } from '@jujulego/tasks';

import { CommandTask } from '@/src/tasks/command-task';
import { ScriptTask } from '@/src/tasks/script-task';

// Classes
export class TestParallelGroup<C extends TaskContext = TaskContext> extends ParallelGroup<C> {
  // Methods
  readonly emit = this._groupEvents.emit;
}

export class TestScriptTask extends ScriptTask {
  // Methods
  readonly emit = this._groupEvents.emit;

  _stop() {
    super._stop();
  }
}

export class TestCommandTask extends CommandTask {
  // Methods
  readonly emit = this._spawnEvents.emit;
}

export class TestSpawnTask<C extends TaskContext = TaskContext> extends SpawnTask<C> {
  // Methods
  readonly emit = this._spawnEvents.emit;
}
