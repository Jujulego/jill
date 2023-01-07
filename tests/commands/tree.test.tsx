import { cleanup, render } from 'ink-testing-library';
import yargs, { type CommandModule } from 'yargs';

import '@/src/commands/tree';
import { COMMAND } from '@/src/bases/command';
import { INK_APP } from '@/src/ink.config';
import { Project } from '@/src/project/project';
import { CURRENT } from '@/src/project/constants';
import { Workspace } from '@/src/project/workspace';
import { container } from '@/src/inversify.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { flushPromises, wrapInkTestApp } from '@/tools/utils';
import { LoadProject } from '@/src/middlewares/load-project';
import { LoadWorkspace } from '@/src/middlewares/load-workspace';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;

let bed: TestBed;
let wksA: Workspace;
let wksB: Workspace;
let wksC: Workspace;

beforeEach(async () => {
  container.snapshot();

  bed = new TestBed();

  wksC = bed.addWorkspace('wks-c');
  wksB = bed.addWorkspace('wks-b')
    .addDependency(wksC, true);
  wksA = bed.addWorkspace('wks-a')
    .addDependency(wksB)
    .addDependency(wksC, true);

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await container.getNamedAsync(COMMAND, 'tree');

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(LoadProject.prototype, 'handler').mockImplementation(async () => {
    container
      .bind(Project)
      .toConstantValue(bed.project)
      .whenTargetNamed(CURRENT);
  });

  jest.spyOn(LoadWorkspace.prototype, 'handler').mockImplementation(async () => {
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
    await yargs.command(command)
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
