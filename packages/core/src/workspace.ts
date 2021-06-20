import path from 'path';

import { Manifest } from './manifest';
import { Project } from './project';
import { Task, TaskOptions } from './task';
import { combine } from './utils';

// Types
export interface WorkspaceRunOptions extends Omit<TaskOptions, 'cwd'> {
  buildDeps?: 'all' | 'prod' | 'none';
}

// Class
export class Workspace {
  // Attributes
  private _lastBuild?: Task;

  // Constructor
  constructor(
    private readonly _cwd: string,
    readonly manifest: Manifest,
    readonly project: Project
  ) {}

  // Methods
  private async _buildDependencies(task: Task) {
    for await (const dep of combine(this.dependencies(), this.devDependencies())) {
      task.addDependency(await dep.build());
    }
  }

  async* dependencies(): AsyncGenerator<Workspace, void, unknown> {
    if (!this.manifest.dependencies) return;

    for (const dep of Object.keys(this.manifest.dependencies)) {
      const ws = await this.project.workspace(dep);

      if (ws) {
        yield ws;
      }
    }
  }

  async* devDependencies(): AsyncGenerator<Workspace, void, unknown> {
    if (!this.manifest.devDependencies) return;

    for (const dep of Object.keys(this.manifest.devDependencies)) {
      const ws = await this.project.workspace(dep);

      if (ws) {
        yield ws;
      }
    }
  }

  async run(script: string, args: string[] = [], opts: WorkspaceRunOptions = {}): Promise<Task> {
    const task = new Task('yarn', [script, ...args], { ...opts, cwd: this.cwd, workspace: this });
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
