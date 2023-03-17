import { GroupTask, type Task, type TaskContext, type TaskOptions } from '@jujulego/tasks';

import { type Workspace } from '@/src/project/workspace';
import { splitCommandLine } from '@/src/utils/string';
import { CommandTask } from '@/src/tasks/command-task';
import { waitFor } from '@jujulego/event-tree';

// Types
export interface ScriptContext extends TaskContext {
  workspace: Workspace;
  script: string;
}

// Class
export class ScriptTask extends GroupTask<ScriptContext> {
  // Constructor
  constructor(
    readonly workspace: Workspace,
    readonly script: string,
    readonly args: string[],
    opts?: TaskOptions
  ) {
    super(`${script} ${workspace.name}`, { workspace, script }, opts);
  }

  // Methods
  private _runScript(script: string, args: string[]): CommandTask | null {
    const line = this.workspace.getScript(script);

    if (!line) {
      return null;
    }

    // Create command task for script
    const command = splitCommandLine(line);
    command.args.push(...args);

    return new CommandTask(this.workspace, command, {
      logger: this._logger
    });
  }

  protected async *_orchestrate(): AsyncGenerator<Task> {
    const script = this._runScript(this.script, this.args);

    if (!script) {
      throw new Error(`No script ${this.script} in ${this.workspace}`);
    }

    yield script;

    await waitFor(script, 'completed');
    this.status = script.status;
  }

  protected _stop(): void {
    for (const tsk of this.tasks) {
      tsk.stop();
    }
  }
}
