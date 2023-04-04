import { waitFor } from '@jujulego/event-tree';
import { GroupTask, type Task, type TaskContext, type TaskOptions } from '@jujulego/tasks';

import { container } from '@/src/inversify.config';
import { type Workspace } from '@/src/project/workspace';
import { splitCommandLine } from '@/src/utils/string';
import { CommandTask } from '@/src/tasks/command-task';
import { JillApplication } from '@/src/jill.application';

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
  private _scriptTasks: Task[];

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
  private async _runScript(script: string, args: string[]): Promise<Task[] | null> {
    const line = this.workspace.getScript(script);

    if (!line) {
      return null;
    }

    // Create command task for script
    const pm = await this.workspace.project.packageManager();
    const [command, ...commandArgs] = splitCommandLine(line);

    if (command === 'jill') {
      const app = container.get(JillApplication);
      return await app.tasksOf(commandArgs, {
        project: this.project,
        workspace: this.workspace,
      });
    }

    return [
      new CommandTask(this.workspace, command, [...commandArgs, ...args], {
        logger: this._logger,
        superCommand: pm === 'yarn' ? 'yarn' : undefined,
      })
    ];
  }

  async prepare(): Promise<void> {
    const tasks = await this._runScript(this.script, this.args);

    if (!tasks) {
      throw new Error(`No script ${this.script} in ${this.workspace.name}`);
    }

    for (const tsk of tasks) {
      this.add(tsk);
    }

    this._scriptTasks = tasks;
  }

  protected async *_orchestrate(): AsyncGenerator<Task, void, undefined> {
    if (!this._scriptTasks) {
      throw new Error('ScriptTask needs to be prepared. Call prepare before starting it');
    }

    yield* this._scriptTasks;

    await Promise.all(this._scriptTasks.map((tsk) => waitFor(tsk, 'completed')));
    this.status = 'done';
  }

  protected _stop(): void {
    for (const tsk of this.scriptTasks) {
      tsk.stop();
    }
  }

  complexity(cache = new Map<string, number>()): number {
    let complexity = super.complexity(cache);

    complexity += this._scriptTasks.reduce((cpl, tsk) => cpl + tsk.complexity(cache), 0);
    cache.set(this.id, complexity);

    return complexity;
  }

  // Properties
  get project() {
    return this.workspace.project;
  }

  get scriptTasks() {
    return this._scriptTasks;
  }
}
