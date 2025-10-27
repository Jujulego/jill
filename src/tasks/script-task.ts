import { GroupTask, type Task, type TaskContext, type TaskOptions, TaskSet } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import { waitFor$ } from 'kyrielle';
import { ClientError } from '../cli/utils/errors.js';
import type { Workspace } from '../projects/workspace.js';
import { splitCommandLine } from '../utils/string.js';
import { CommandTask } from './command-task.js';

// Class
/** @deprecated use {@link runScript$} instead */
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
    const set = new TaskSet();

    if (!command) {
      return set;
    }

    if (command === 'jill') {
      const argv = commandArgs.map(arg => arg.replace(/^["'](.+)["']$/, '$1'));

      const { PlannerService } = await import('../cli/services/planner.service.js');
      const plannerService = inject$(PlannerService);
      const tasks = await plannerService.plan(argv, this.workspace.root);

      if (tasks) {
        return tasks;
      }
    }

    const pm = await this.workspace.project.packageManager();

    set.add(
      new CommandTask(this.workspace, command, [...commandArgs, ...args], {
        logger: this.logger$,
        superCommand: pm === 'yarn' ? ['yarn', 'exec'] : undefined,
      })
    );

    return set;
  }

  async prepare(): Promise<void> {
    // Prepare script run
    this._scriptTasks = await this._runScript(this.script, this.args);

    if (!this._scriptTasks) {
      throw new ScriptNotFound(`No script ${this.script} in ${this.workspace.name}`);
    }

    // Prepare hooks run
    if (this._runHooks) {
      this._preHookTasks = await this._runScript(`pre${this.script}`, []);
      this._postHookTasks = await this._runScript(`post${this.script}`, []);
    }

    // Add tasks to group
    if (this._preHookTasks) {
      this.logger$.verbose(`found pre-hook script "pre${this.script}"`);

      for (const tsk of this._preHookTasks) {
        this.add(tsk);
      }
    }

    for (const tsk of this._scriptTasks) {
      this.add(tsk);
    }

    if (this._postHookTasks) {
      this.logger$.verbose(`found post-hook script "post${this.script}"`);

      for (const tsk of this._postHookTasks) {
        this.add(tsk);
      }
    }
  }

  protected async *onOrchestrate(): AsyncGenerator<Task, void, undefined> {
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
    const results = await waitFor$(set.events$, 'finished');
    return results.failed > 0;
  }

  protected async onStop(): Promise<void> {
    if (!this._scriptTasks) return;

    for (const tsk of this._scriptTasks) {
      await tsk.stop();
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

export class ScriptNotFound extends ClientError {
  name = 'ScriptNotFound';
}