import { ParallelGroup, SpawnTask, type TaskContext, TaskManager } from '@jujulego/tasks';

import { CommandTask } from '@/src/tasks/command-task.js';
import { ScriptTask } from '@/src/tasks/script-task.js';

// Classes
export class TestTaskManager extends TaskManager {
  // Methods
  readonly emit = this._events.emit;
}

export class TestParallelGroup<C extends TaskContext = TaskContext> extends ParallelGroup<C> {
  // Methods
  readonly emit = this._groupEvents.emit;
}

export class TestScriptTask extends ScriptTask {
  // Methods
  protected onStart() {
    return;
  }

  async* onOrchestrate() {
    yield* super.onOrchestrate();
  }

  async onStop() {
    await super.onStop();
  }
}

export class TestCommandTask extends CommandTask {
  // Methods
  protected onStart() {
    return;
  }
}

export class TestSpawnTask<C extends TaskContext = TaskContext> extends SpawnTask<C> {
  // Methods
  readonly emit = this._spawnEvents.emit;
}
