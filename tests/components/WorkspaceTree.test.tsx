import WorkspaceTree from '@/src/components/WorkspaceTree.js';
import { type Workspace } from '@/src/projects/workspace.js';
import { TestBed } from '@/tools/test-bed.js';
import { cleanup, render } from 'ink-testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Setup
let bed: TestBed;
let wksA: Workspace;
let wksB: Workspace;
let wksC: Workspace;

beforeEach(() => {
  bed = new TestBed();

  wksC = bed.addWorkspace('wks-c');
  wksB = bed.addWorkspace('wks-b')
    .addDependency(wksC, true);
  wksA = bed.addWorkspace('wks-a')
    .addDependency(wksB)
    .addDependency(wksC, true);

  vi.spyOn(wksA, 'dependencies');
  vi.spyOn(wksA, 'devDependencies');
  vi.spyOn(wksB, 'dependencies');
  vi.spyOn(wksB, 'devDependencies');
  vi.spyOn(wksC, 'dependencies');
  vi.spyOn(wksC, 'devDependencies');
});

afterEach(() => {
  cleanup();
});

// Tests
describe('<WorkspaceTree>', () => {
  it('should print workspace and all it\'s dependencies', async () => {
    const { lastFrame } = render(<WorkspaceTree workspace={wksA} />);

    await vi.waitFor(() => {
      expect(lastFrame()).toEqualLines([
        expect.ignoreColor('wks-a@1.0.0'),
        expect.ignoreColor('├─ wks-b@1.0.0'),
        expect.ignoreColor('│  └─ wks-c@1.0.0'),
        expect.ignoreColor('└─ wks-c@1.0.0')
      ]);
    });

    expect(wksA.dependencies).toHaveBeenCalled();
    expect(wksA.devDependencies).toHaveBeenCalled();

    expect(wksB.dependencies).toHaveBeenCalled();
    expect(wksB.devDependencies).toHaveBeenCalled();

    expect(wksC.dependencies).toHaveBeenCalled();
    expect(wksC.devDependencies).toHaveBeenCalled();
  });
});
