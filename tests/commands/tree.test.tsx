import { cleanup, render } from 'ink-testing-library';
import yargs, { type CommandModule } from 'yargs';
import { vi } from 'vitest';

import { TreeCommand } from '@/src/commands/tree.js';
import { ContextService } from '@/src/commons/context.service.js';
import { INK_APP } from '@/src/ink.config.js';
import { type Workspace } from '@/src/project/workspace.js';
import { container } from '@/src/inversify.config.js';
import Layout from '@/src/ui/layout.js';

import { TestBed } from '@/tools/test-bed.js';
import { flushPromises, wrapInkTestApp } from '@/tools/utils.js';

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
  vi.restoreAllMocks();

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
describe('jill tree', () => {
  it('should print current workspace', async () => {
    context.reset();

    // Run command
    await yargs().command(command)
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
