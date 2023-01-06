import { cleanup, render } from 'ink-testing-library';
import yargs from 'yargs';

import '@/src/commands/tree';
import { loadProject } from '@/src/middlewares/load-project';
import { loadWorkspace } from '@/src/middlewares/load-workspace';
import { Project } from '@/src/project/project';
import { Workspace } from '@/src/project/workspace';
import { container } from '@/src/inversify.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { flushPromises } from '@/tools/utils';
import { CURRENT } from '@/src/project/constants';
import { INK_APP } from '@/src/ink.config';
import { COMMAND } from '@/src/bases/command';

// Setup
let app: ReturnType<typeof render>;

let bed: TestBed;
let wksA: Workspace;
let wksB: Workspace;
let wksC: Workspace;

beforeEach(() => {
  container.snapshot();

  bed = new TestBed();

  wksC = bed.addWorkspace('wks-c');
  wksB = bed.addWorkspace('wks-b')
    .addDependency(wksC, true);
  wksA = bed.addWorkspace('wks-a')
    .addDependency(wksB)
    .addDependency(wksC, true);

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(app as any);

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(loadProject, 'handler').mockImplementation(() => {
    container
      .bind(Project)
      .toConstantValue(bed.project)
      .whenTargetNamed(CURRENT);
  });
  jest.spyOn(loadWorkspace, 'handler').mockImplementation(() => {
    container
      .bind(Workspace)
      .toConstantValue(wksA)
      .whenTargetNamed(CURRENT);
  });

  jest.spyOn(wksA, 'dependencies');
  jest.spyOn(wksA, 'devDependencies');
  jest.spyOn(wksB, 'dependencies');
  jest.spyOn(wksB, 'devDependencies');
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
    await yargs.command(await container.getNamedAsync(COMMAND, 'tree'))
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
