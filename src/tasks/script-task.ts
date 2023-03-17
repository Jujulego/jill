import { waitFor } from '@jujulego/event-tree';
import { GroupTask, type Task, type TaskContext, type TaskOptions } from '@jujulego/tasks';

import { type Workspace } from '@/src/project/workspace';
import { splitCommandLine } from '@/src/utils/string';
import { CommandTask } from '@/src/tasks/command-task';

// Types
export interface ScriptContext extends TaskContext {
  workspace: Workspace;
  script: string;
}

// Utils
export function isScriptCtx(ctx: Readonly<TaskContext>): ctx is Readonly<ScriptContext> {
  return 'workspace' in ctx && 'script' in ctx;
}

// Class
export class ScriptTask extends GroupTask<ScriptContext> {
  // Attributes
  private _script: CommandTask;

  // Constructor
  constructor(
    readonly workspace: Workspace,
    readonly script: string,
    readonly args: string[],
    opts?: TaskOptions
  ) {
    super(script, { workspace, script }, opts);
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

  prepare(): void {
    const script = this._runScript(this.script, this.args);

    if (!script) {
      throw new Error(`No script ${this.script} in ${this.workspace}`);
    }

    this.add(script);
    this._script = script;
  }

  protected async *_orchestrate(): AsyncGenerator<Task> {
    if (!this._script) {
      throw new Error('ScriptTask needs to be prepared. Call prepare before starting it');
    }

    yield this._script;

    await waitFor(this._script, 'completed');
    this.status = this._script.status;
  }

  protected _stop(): void {
    for (const tsk of this.tasks) {
      tsk.stop();
    }
  }
}
