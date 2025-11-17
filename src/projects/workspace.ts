import type { Job$, SpawnJob$ } from '@jujulego/tasks';
import { asyncScope$, inject$ } from '@kyrielle/injector';
import { type Logger, withLabel } from '@kyrielle/logger';
import path from 'node:path';
import type { Package } from 'normalize-package-data';
import { satisfies } from 'semver';
import { command$ } from '../jobs/command$.js';
import { runScript$, type RunScriptOpts, type ScriptWorkflow$ } from '../jobs/run-script$.js';
import { GitService } from '../services/git.service.js';
import { CONFIG, LOGGER } from '../tokens.js';
import { combine } from '../utils/generators.js';
import type { Project } from './project.js';

export class Workspace {
  // Attributes
  private readonly _affectedCache = new Map<string, Promise<boolean>>();
  private readonly _logger: Logger;
  private readonly _git = inject$(GitService);
  private readonly _root: string;
  private readonly _jobs = new Map<string, ScriptWorkflow$>();

  // Constructor
  constructor(
    root: string,
    readonly manifest: Package,
    readonly project: Project,
  ) {
    this._root = root;
    this._logger = inject$(LOGGER).child(withLabel(manifest.name));
  }

  // Methods
  private async _buildDependencies(job: Job$, opts: WorkspaceRunOptions) {
    const generators: AsyncGenerator<Workspace, void>[] = [];

    switch (opts.buildDeps ?? 'all') {
      case 'all':
        generators.unshift(this.devDependencies());

      // eslint-disable-next no-fallthrough
      case 'prod':
        generators.unshift(this.dependencies());
    }

    // Build deps
    for await (const dep of combine(...generators)) {
      const build = await dep.build(opts);

      if (build) {
        job.dependsOn(build);
      }
    }
  }

  private async* _loadDependencies(dependencies: Record<string, string>, kind: string): AsyncGenerator<Workspace, void> {
    for (const [dep, range] of Object.entries(dependencies)) {
      const ws = await this.project.workspace(dep);

      if (ws) {
        if (ws._satisfies(this, range)) {
          yield ws;
        } else {
          this._logger.warning(`ignoring ${kind} ${ws.reference} as it does not match requirement ${range}`);
        }
      }
    }
  }

  private async _isAffected(reference: string): Promise<boolean> {
    const isAffected = await this._git.isAffected(reference, [this.root], {
      cwd: this.project.root,
      logger: this._logger,
    });

    if (isAffected) {
      return true;
    }

    // Test dependencies
    const proms: Promise<boolean>[] = [];

    for await (const dep of combine(this.dependencies(), this.devDependencies())) {
      proms.push(dep.isAffected(reference));
    }

    const results = await Promise.all(proms);
    return results.some(r => r);
  }

  private _satisfies(from: Workspace, range: string): boolean {
    if (range.startsWith('file:')) {
      return path.resolve(from.root, range.substring(5)) === this.root;
    }

    if (range.startsWith('workspace:')) {
      range = range.substring(10);
    }

    return !this.version || satisfies(this.version, range);
  }

  async isAffected(reference: string): Promise<boolean> {
    let isAffected = this._affectedCache.get(reference);

    if (!isAffected) {
      isAffected = this._isAffected(reference);
      this._affectedCache.set(reference, isAffected);
    }

    return await isAffected;
  }

  async* dependencies(): AsyncGenerator<Workspace, void> {
    if (!this.manifest.dependencies) return;

    for await (const ws of this._loadDependencies(this.manifest.dependencies, 'dependency')) {
      yield ws;
    }
  }

  async* devDependencies(): AsyncGenerator<Workspace, void> {
    if (!this.manifest.devDependencies) return;

    for await (const ws of this._loadDependencies(this.manifest.devDependencies, 'devDependency')) {
      yield ws;
    }
  }

  async build(opts: WorkspaceRunOptions = {}): Promise<Job$ | null> {
    const script = opts.buildScript ?? 'build';
    const job = await this.run(script, [], opts);

    if (!job) {
      this._logger.warning(`will not be built (no "${script}" script found)`);
    }

    return job;
  }

  async exec(command: string, args: string[] = [], opts: WorkspaceRunOptions = {}): Promise<SpawnJob$> {
    const pm = await this.project.packageManager();
    const job = command$(this, command, args, {
      ...opts,
      logger: this._logger.child(withLabel(`${this.name}$${command}`)),
      superCommand: pm === 'yarn' ? ['yarn', 'exec'] : undefined
    });

    await this._buildDependencies(job, opts);

    return job;
  }

  getScript(script: string): string | null {
    const { scripts = {} } = this.manifest;
    return scripts[script] || null;
  }

  async run(script: string, args: string[] = [], opts: WorkspaceRunOptions = {}): Promise<ScriptWorkflow$ | null> {
    // Script not found
    if (!this.getScript(script)) {
      return null;
    }

    // Create task if it doesn't exist yet
    let job = this._jobs.get(script);

    if (!job) {
      const config = await inject$(CONFIG, asyncScope$());

      job = await runScript$(this, script, args, {
        ...opts,
        logger: this._logger.child(withLabel(`${this.name}#${script}`)),
        runHooks: config.hooks,
      });

      await this._buildDependencies(job, opts);

      this._jobs.set(script, job);
    }

    return job;
  }

  // Properties
  get name(): string {
    return this.manifest.name;
  }

  get reference(): string {
    return this.version ? `${this.name}@${this.version}` : this.name;
  }

  get root(): string {
    return path.resolve(this.project.root, this._root);
  }

  get version(): string {
    return this.manifest.version;
  }
}

// Types
export type WorkspaceDepsMode = 'all' | 'prod' | 'none';

export interface WorkspaceRunOptions extends Omit<RunScriptOpts, 'logger'> {
  readonly buildDeps?: WorkspaceDepsMode;
  readonly buildScript?: string;
}
