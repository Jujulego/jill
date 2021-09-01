import path from 'path';
import { Logger } from 'winston';

import { logger } from './logger';
import type { Manifest } from './manifest';
import { Project } from './project';
import { Task, TaskOptions } from './task';
import { combine, spawn } from './utils';

// Types
export interface WorkspaceRunOptions extends Omit<TaskOptions, 'cwd'> {
  buildDeps?: 'all' | 'prod' | 'none';
}

// Class
export class Workspace {
  // Attributes
  private _lastBuild?: Task;

  private readonly _logger: Logger;
  private readonly _isAffected = new Map<string, boolean>();

  // Constructor
  constructor(
    private readonly _cwd: string,
    readonly manifest: Manifest,
    readonly project: Project
  ) {
    this._logger = logger.child({ label: manifest.name });
  }

  // Methods
  private async _buildDependencies(task: Task) {
    for await (const dep of combine(this.dependencies(), this.devDependencies())) {
      task.addDependency(await dep.build());
    }
  }

  async isAffected(base: string): Promise<boolean> {
    let isAffected = this._isAffected.get(base);

    if (isAffected === undefined) {
      // Test workspace
      const { stdout } = await spawn('git', ['diff', '--name-only', base, '--', this.cwd], {
        cwd: this.project.root,
        logger: this._logger
      });

      isAffected = stdout.length > 0;

      if (!isAffected) {
        // Test it's dependencies
        for await (const dep of combine(this.dependencies(), this.devDependencies())) {
          if (await dep.isAffected(base)) {
            isAffected = true;
            break;
          }
        }
      }

      this._isAffected.set(base, isAffected);
    }

    return isAffected;
  }

  async* dependencies(): AsyncGenerator<Workspace, void> {
    if (!this.manifest.dependencies) return;

    for (const dep of Object.keys(this.manifest.dependencies)) {
      const ws = await this.project.workspace(dep);

      if (ws) {
        yield ws;
      }
    }
  }

  async* devDependencies(): AsyncGenerator<Workspace, void> {
    if (!this.manifest.devDependencies) return;

    for (const dep of Object.keys(this.manifest.devDependencies)) {
      const ws = await this.project.workspace(dep);

      if (ws) {
        yield ws;
      }
    }
  }

  async run(script: string, args: string[] = [], opts: WorkspaceRunOptions = {}): Promise<Task> {
    const pm = await this.project.packageManager();

    const task = new Task(pm, ['run', script, ...args], {
      ...opts,
      cwd: this.cwd,
      logger: this._logger,
      context: { workspace: this }
    });
    await this._buildDependencies(task);

    return task;
  }

  async build(): Promise<Task> {
    if (!this._lastBuild) {
      this._lastBuild = await this.run('jill:build');
    }

    return this._lastBuild;
  }

  // Properties
  get name(): string {
    return this.manifest.name;
  }

  get cwd(): string {
    return path.resolve(this.project.root, this._cwd);
  }
}
