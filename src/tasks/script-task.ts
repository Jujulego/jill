import { waitFor$ } from '@jujulego/event-tree';
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

export interface ScriptOpts extends TaskOptions {
  runHooks?: boolean;
}

// Utils
export function isScriptCtx(ctx: Readonly<TaskContext>): ctx is Readonly<ScriptContext> {
  return 'workspace' in ctx && 'script' in ctx;
}

// Class
export class ScriptTask extends GroupTask<ScriptContext> {
  // Attributes
  private _preHookTasks: TaskSet | null = null;
  private _postHookTasks: TaskSet | null = null;
  private _scriptTasks: TaskSet | null = null;
  private readonly _runHooks: boolean;

  // Constructor
  constructor(
    readonly workspace: Workspace,
    readonly script: string,
    readonly args: string[],
    opts?: ScriptOpts
  ) {
    super(script, { workspace, script }, opts);
    this._runHooks = opts?.runHooks ?? true;
  }

  // Methods
  private async _runScript(script: string, args: string[]): Promise<TaskSet | null> {
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
        const set = new TaskSet();

        for (const tsk of tasks) {
          set.add(tsk);
        }

        return set;
      }
    }

    const pm = await this.workspace.project.packageManager();

    const set = new TaskSet();
    set.add(
      new CommandTask(this.workspace, command, [...commandArgs, ...args], {
        logger: this._logger,
        superCommand: pm === 'yarn' ? ['yarn', 'exec'] : undefined,
      })
    );

    return set;
  }

  async prepare(): Promise<void> {
    // Prepare script run
    this._scriptTasks = await this._runScript(this.script, this.args);

    if (!this._scriptTasks) {
      throw new Error(`No script ${this.script} in ${this.workspace.name}`);
    }

    // Prepare hooks run
    if (this._runHooks) {
      this._preHookTasks = await this._runScript(`pre${this.script}`, []);
      this._postHookTasks = await this._runScript(`post${this.script}`, []);
    }

    // Add tasks to group
    for (const tsk of this._preHookTasks ?? []) {
      this.add(tsk);
    }

    for (const tsk of this._scriptTasks) {
      this.add(tsk);
    }

    for (const tsk of this._postHookTasks ?? []) {
      this.add(tsk);
    }
  }

  protected async *_orchestrate(): AsyncGenerator<Task, void, undefined> {
    if (!this._scriptTasks) {
      throw new Error('ScriptTask needs to be prepared. Call prepare before starting it');
    }

    // Run pre-hook
    if (this._preHookTasks) {
      yield* this._preHookTasks;

      if (await this._hasFailed(this._preHookTasks)) {
        return this.setStatus('failed');
      }
    }

    // Run script
    yield* this._scriptTasks;

    if (await this._hasFailed(this._scriptTasks)) {
      return this.setStatus('failed');
    }

    // Run post-hook
    if (this._postHookTasks) {
      yield* this._postHookTasks;

      if (await this._hasFailed(this._postHookTasks)) {
        return this.setStatus('failed');
      }
    }

    this.setStatus('done');
  }

  private async _hasFailed(set: TaskSet): Promise<boolean> {
    const results = await waitFor$(set, 'finished');
    return results.failed > 0;
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
