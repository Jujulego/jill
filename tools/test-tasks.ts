import { CommandTask } from '@/src/tasks/command-task.js';
import { ScriptTask } from '@/src/tasks/script-task.js';
import { ParallelGroup, type TaskContext, TaskManager } from '@jujulego/tasks';

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
