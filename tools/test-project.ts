import { container } from '@/src/inversify.config.ts';
import { Logger } from '@/src/commons/logger.service.ts';
import { Project, type ProjectOptions } from '@/src/project/project.ts';

import { TestWorkspace } from './test-workspace.ts';

// Class
export class TestProject extends Project {
  // Attributes
  readonly testMainWorkspace: TestWorkspace;
  readonly testWorkspaces = new Map<string, TestWorkspace>();

  // Constructor
  constructor(root: string, opts?: ProjectOptions) {
    super(root, container.get(Logger).child({ label: 'projects' }), opts);

    this.testMainWorkspace = new TestWorkspace(root, {
      _id: 'main',
      name: 'main',
      version: '1.0.0',
      readme: '',
    }, this);
  }

  // Methods
  addWorkspace(wks: TestWorkspace): void {
    this.testWorkspaces.set(wks.name, wks);

    this.testMainWorkspace.manifest.workspaces ??= [];
    this.testMainWorkspace.manifest.workspaces.push(wks.name);
  }

  override async mainWorkspace(): Promise<TestWorkspace> {
    return this.testMainWorkspace;
  }

  override async currentWorkspace(cwd?: string): Promise<TestWorkspace | null> {
    return (await super.currentWorkspace(cwd)) as TestWorkspace | null;
  }

  override async* workspaces(): AsyncGenerator<TestWorkspace, void> {
    for (const wks of this.testWorkspaces.values()) {
      yield wks;
    }
  }

  override async workspace(name?: string): Promise<TestWorkspace | null> {
    if (!name) {
      return await this.currentWorkspace();
    }

    return this.testWorkspaces.get(name) ?? null;
  }
}
