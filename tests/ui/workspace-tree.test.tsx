import { render, cleanup } from 'ink-testing-library';

import { Workspace } from '../../src/project';
import { WorkspaceTree } from '../../src/ui';
import { TestBed } from '../../tools/test-bed';
import { flushPromises } from '../../tools/utils';

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

  jest.spyOn(wksA, 'dependencies');
  jest.spyOn(wksA, 'devDependencies');
  jest.spyOn(wksB, 'dependencies');
  jest.spyOn(wksB, 'devDependencies');
  jest.spyOn(wksC, 'dependencies');
  jest.spyOn(wksC, 'devDependencies');
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
      'wks-a@1.0.0',
      '├─ wks-b@1.0.0',
      '│  └─ wks-c@1.0.0',
      '└─ wks-c@1.0.0'
    ]);
  });
});
