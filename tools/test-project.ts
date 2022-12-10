import { Project, ProjectOptions } from '../src/project';
import { TestWorkspace } from './test-workspace';

// Class
export class TestProject extends Project {
  // Attributes
  private readonly _testMainWorkspace: TestWorkspace;
  private readonly _testWorkspaces = new Map<string, TestWorkspace>();

  // Constructor
  constructor(root: string, opts?: ProjectOptions) {
    super(root, opts);

    this._testMainWorkspace = new TestWorkspace(root, {
      _id: 'main',
      name: 'main',
      version: '1.0.0',
      readme: '',
    }, this);
  }

  // Methods
  addWorkspace(wks: TestWorkspace): void {
    this._testWorkspaces.set(wks.name, wks);

    this._testMainWorkspace.manifest.workspaces ??= [];
    this._testMainWorkspace.manifest.workspaces.push(wks.name);
  }

  override async mainWorkspace(): Promise<TestWorkspace> {
    return this._testMainWorkspace;
  }

  override async currentWorkspace(cwd?: string): Promise<TestWorkspace | null> {
    return (await super.currentWorkspace(cwd)) as TestWorkspace | null;
  }

  override async* workspaces(): AsyncGenerator<TestWorkspace, void> {
    for (const wks of this._testWorkspaces.values()) {
      yield wks;
    }
  }

  override async workspace(name?: string): Promise<TestWorkspace | null> {
    if (!name) {
      return await this.currentWorkspace();
    }

    return this._testWorkspaces.get(name) ?? null;
  }
}
