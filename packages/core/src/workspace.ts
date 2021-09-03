import path from 'path';
import { Logger } from 'winston';

import { git } from './git';
import { logger } from './logger';
import type { Manifest } from './manifest';
import { Project } from './project';
import { SpawnTask, SpawnTaskOption, Task } from './tasks';
import { combine } from './utils';

// Types
export interface WorkspaceRunOptions extends Omit<SpawnTaskOption, 'cwd'> {
  buildDeps?: 'all' | 'prod' | 'none';
}

// Class
export class Workspace {
  // Attributes
  private _lastBuild?: Task;

  private readonly _logger: Logger;
  private readonly _isAffected = new Map<string, boolean | SpawnTask>();

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
      task.dependsOn(await dep.build());
    }
  }

  async isAffected(base: string): Promise<boolean> {
    let isAffected = this._isAffected.get(base);

    if (typeof isAffected !== 'boolean') {
      // Run git diff
      if (!(isAffected instanceof SpawnTask)) {
        isAffected = git.diff(['--quiet', base, '--', this.cwd], {
          cwd: this.project.root,
          logger: this._logger,
          streamLogLevel: 'debug'
        });

        this._isAffected.set(base, isAffected);
      }

      // Wait for git diff to end and parse exit code
      if (!['done', 'failed'].includes(isAffected.status)) {
        await isAffected.waitFor('done', 'failed');
      }

      isAffected = isAffected.exitCode !== 0;

      // If not affected check for workspaces
      if (!isAffected) {
        // Test it's dependencies
        const proms: Promise<boolean>[] = [];

        for await (const dep of combine(this.dependencies(), this.devDependencies())) {
          proms.push(dep.isAffected(base));
        }

        const results = await Promise.all(proms);
        isAffected = results.some(r => r);
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

    const task = new SpawnTask(pm, ['run', script, ...args], {
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
