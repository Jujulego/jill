import { waitFor } from '@jujulego/event-tree';
import { GroupTask, type Task, type TaskContext, type TaskOptions, TaskSet } from '@jujulego/tasks';

import { container } from '@/src/inversify.config.ts';
import { JillApplication } from '@/src/jill.application.ts';
import { type Workspace } from '@/src/project/workspace.ts';
import { CommandTask } from '@/src/tasks/command-task.ts';
import { splitCommandLine } from '@/src/utils/string.ts';

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
  private _scriptTasks?: TaskSet;

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
    const [command, ...commandArgs] = splitCommandLine(line);

    if (command === 'jill') {
      this._logger.debug(`Interpreting ${line}`);
      const argv = commandArgs.map(arg => arg.replace(/^["'](.+)["']$/, '$1'));

      const app = container.get(JillApplication);
      const tasks = await app.tasksOf(argv, {
        project: this.project,
        workspace: this.workspace,
      });

      if (tasks.length) {
        return tasks;
      }
    }

    const pm = await this.workspace.project.packageManager();

    return [
      new CommandTask(this.workspace, command, [...commandArgs, ...args], {
        logger: this._logger,
        superCommand: pm === 'yarn' ? ['yarn', 'exec'] : undefined,
      })
    ];
  }

  async prepare(): Promise<void> {
    const tasks = await this._runScript(this.script, this.args);

    if (!tasks) {
      throw new Error(`No script ${this.script} in ${this.workspace.name}`);
    }

    this._scriptTasks = new TaskSet();

    for (const tsk of tasks) {
      this.add(tsk);
      this._scriptTasks.add(tsk);
    }
  }

  protected async *_orchestrate(): AsyncGenerator<Task, void, undefined> {
    if (!this._scriptTasks) {
      throw new Error('ScriptTask needs to be prepared. Call prepare before starting it');
    }

    yield* this._scriptTasks;

    const results = await waitFor(this._scriptTasks, 'finished');
    this.setStatus(results.failed === 0 ? 'done' : 'failed');
  }

  protected _stop(): void {
    if (!this._scriptTasks) return;

    for (const tsk of this._scriptTasks) {
      tsk.stop();
    }
  }

  complexity(cache = new Map<string, number>()): number {
    let complexity = super.complexity(cache);

    if (this._scriptTasks) {
      complexity += this._scriptTasks.tasks.reduce((cpl, tsk) => cpl + tsk.complexity(cache), 0);
    }

    cache.set(this.id, complexity);

    return complexity;
  }

  // Properties
  get project() {
    return this.workspace.project;
  }
}
