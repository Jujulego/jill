import { cleanup, render } from 'ink-testing-library';
import yargs, { type CommandModule } from 'yargs';

import { TreeCommand } from '@/src/commands/tree';
import { ContextService } from '@/src/commons/context.service';
import { INK_APP } from '@/src/ink.config';
import { type Workspace } from '@/src/project/workspace';
import { container } from '@/src/inversify.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { flushPromises, wrapInkTestApp } from '@/tools/utils';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;
let context: ContextService;

let bed: TestBed;
let wksA: Workspace;
let wksB: Workspace;
let wksC: Workspace;

beforeAll(async () => {
  container.snapshot();
});

beforeEach(async () => {
  container.snapshot();
  container.restore();

  bed = new TestBed();

  wksC = bed.addWorkspace('wks-c');
  wksB = bed.addWorkspace('wks-b')
    .addDependency(wksC, true);
  wksA = bed.addWorkspace('wks-a')
    .addDependency(wksB)
    .addDependency(wksC, true);

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await bed.prepareCommand(TreeCommand, wksA);
  context = container.get(ContextService);

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

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
describe('jill tree', () => {
  it('should print current workspace', async () => {
    context.reset();

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
      expect.ignoreColor('wks-a@1.0.0'),
      expect.ignoreColor('├─ wks-b@1.0.0'),
      expect.ignoreColor('│  └─ wks-c@1.0.0'),
      expect.ignoreColor('└─ wks-c@1.0.0')
    ]);
  });
});
