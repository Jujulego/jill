import { cleanup, render } from 'ink-testing-library';
import yargs from 'yargs';

import treeCommand from '../../src/commands/tree';
import { loadProject, loadWorkspace, setupInk } from '../../src/middlewares';
import { Project, Workspace } from '../../src/project';
import { container, CURRENT, INK_APP } from '../../src/services';
import { Layout } from '../../src/ui';

import { TestBed } from '../../tools/test-bed';
import { flushPromises } from '../../tools/utils';

// Setup
let app: ReturnType<typeof render>;

let bed: TestBed;
let wksA: Workspace;
let wksB: Workspace;
let wksC: Workspace;

beforeEach(() => {
  container.snapshot();

  bed = new TestBed();

  wksA = bed.workspace('wks-a');
  wksB = bed.workspace('wks-b');
  wksC = bed.workspace('wks-c');

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(setupInk, 'handler').mockImplementation(() => {
    app = render(<Layout />);
    container.bind(INK_APP).toConstantValue(app);
  });
  jest.spyOn(loadProject, 'handler').mockImplementation(() => {
    container.bind(Project)
      .toConstantValue(bed.project)
      .whenTargetNamed(CURRENT);
  });
  jest.spyOn(loadWorkspace, 'handler').mockImplementation(() => {
    container.bind(Workspace)
      .toConstantValue(wksA)
      .whenTargetNamed(CURRENT);
  });

  jest.spyOn(wksA, 'dependencies').mockImplementation(async function* () { yield wksB; });
  jest.spyOn(wksA, 'devDependencies').mockImplementation(async function* () { yield wksC; });
  jest.spyOn(wksB, 'dependencies');
  jest.spyOn(wksB, 'devDependencies').mockImplementation(async function* () { yield wksC; });
  jest.spyOn(wksC, 'dependencies');
  jest.spyOn(wksC, 'devDependencies');
});

afterEach(() => {
  container.restore();
  cleanup();
});

// Tests
describe('jill tree', () => {
  it('should print current workspace', async () => {
    // Run command
    await yargs.command(treeCommand)
      .parse('tree -w wks-a');

    await flushPromises();
    expect(wksA.dependencies).toHaveBeenCalled();
    expect(wksA.devDependencies).toHaveBeenCalled();

    await flushPromises();
    expect(wksB.dependencies).toHaveBeenCalled();
    expect(wksB.devDependencies).toHaveBeenCalled();

    await flushPromises();
    expect(wksC.dependencies).toHaveBeenCalled();
    expect(wksC.devDependencies).toHaveBeenCalled();

    expect(app.lastFrame()).toEqualLines([
      'wks-a@1.0.0',
      '├─ wks-b@1.0.0',
      '│  └─ wks-c@1.0.0',
      '└─ wks-c@1.0.0'
    ]);
  });
});
