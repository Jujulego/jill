import { Logger, withLabel } from '@jujulego/logger';
import { inject } from 'inversify';
import { AsyncLocalStorage } from 'node:async_hooks';

import { Service } from '@/src/modules/service.ts';
import { type Project } from '@/src/project/project.ts';
import { type Workspace } from '@/src/project/workspace.ts';
import { type JillApplication } from '@/src/jill.application.ts';

// Types
export interface Context {
  application?: JillApplication;
  project?: Project;
  workspace?: Workspace;
}

// Service
@Service()
export class ContextService implements Context {
  // Attributes
  private readonly _logger: Logger;
  private readonly _storage = new AsyncLocalStorage<Context>();

  // Constructor
  constructor(@inject(Logger) logger: Logger) {
    this._logger = logger.child(withLabel('context'));
    this.reset();
  }

  // Methods
  reset(context: Context = {}): void {
    this._storage.enterWith(context);
  }

  private _getContext(): Context {
    const ctx = this._storage.getStore();

    if (!ctx) {
      this._logger.warning('Trying to access uninitialized context');
      return {};
    }

    return ctx;
  }

  private _updateContext(update: Partial<Context>): void {
    Object.assign(this._getContext(), update);
  }

  // Properties
  get application(): JillApplication | undefined {
    return this._getContext().application;
  }

  set application(application: JillApplication | undefined) {
    this._updateContext({ application });
  }

  get project(): Project | undefined {
    return this._getContext().project;
  }

  set project(project: Project | undefined) {
    this._updateContext({ project });
  }

  get workspace(): Workspace | undefined {
    return this._getContext().workspace;
  }

  set workspace(workspace: Workspace | undefined) {
    this._updateContext({ workspace });
  }
}
