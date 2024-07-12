import { render, cleanup } from 'ink-testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@/src/commons/logger.service.js';
import { type Workspace } from '@/src/project/workspace.js';
import WorkspaceTree from '@/src/ui/workspace-tree.js';

import { TestBed } from '@/tools/test-bed.js';
import { flushPromises } from '@/tools/utils.js';

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

    // Load dependencies
    await flushPromises();
    expect(wksA.dependencies).toHaveBeenCalled();
    expect(wksA.devDependencies).toHaveBeenCalled();

    await flushPromises();
    expect(wksB.dependencies).toHaveBeenCalled();
    expect(wksB.devDependencies).toHaveBeenCalled();

    await flushPromises();
    expect(wksC.dependencies).toHaveBeenCalled();
    expect(wksC.devDependencies).toHaveBeenCalled();

    // Final render !
    expect(lastFrame()).toEqualLines([
      expect.ignoreColor('wks-a@1.0.0'),
      expect.ignoreColor('├─ wks-b@1.0.0'),
      expect.ignoreColor('│  └─ wks-c@1.0.0'),
      expect.ignoreColor('└─ wks-c@1.0.0')
    ]);
  });
});
