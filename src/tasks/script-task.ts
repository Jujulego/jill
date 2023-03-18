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
  private async _runScript(script: string, args: string[]): Promise<CommandTask | null> {
    const line = this.workspace.getScript(script);

    if (!line) {
      return null;
    }

    // Create command task for script
    const pm = await this.workspace.project.packageManager();
    const [command, ...commandArgs] = splitCommandLine(line);

    return new CommandTask(this.workspace, command, [...commandArgs, ...args], {
      logger: this._logger,
      superCommand: pm === 'yarn' ? 'yarn' : undefined,
    });
  }

  async prepare(): Promise<void> {
    const script = await this._runScript(this.script, this.args);

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

  complexity(cache = new Map<string, number>()): number {
    let complexity = super.complexity(cache);

    complexity += this._script.complexity(cache);
    cache.set(this.id, complexity);

    return complexity;
  }

  // Properties
  get project() {
    return this.workspace.project;
  }
}
