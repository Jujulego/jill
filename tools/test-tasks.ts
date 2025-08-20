import { CommandTask } from '@/src/tasks/command-task.js';
import { ScriptTask } from '@/src/tasks/script-task.js';

// Classes
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
