import { Logger } from '@jujulego/logger';
import { cleanup, render } from 'ink-testing-library';
import cp from 'node:child_process';
import EventEmitter from 'node:events';
import yargs, { type CommandModule } from 'yargs';
import { expect, vi } from 'vitest';

import '@/src/commons/logger.service.js';
import { ExecCommand } from '@/src/commands/exec.js';
import { ContextService } from '@/src/commons/context.service.js';
import { CONFIG } from '@/src/config/config-loader.js';
import { INK_APP } from '@/src/ink.config.js';
import { container } from '@/src/inversify.config.js';
import { type Workspace } from '@/src/project/workspace.js';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config.js';
import Layout from '@/src/ui/layout.js';

import { TestBed } from '@/tools/test-bed.js';
import { TestTaskManager } from '@/tools/test-tasks.js';
import { wrapInkTestApp } from '@/tools/utils.js';

// Setup global config
container.rebind(CONFIG).toConstantValue({ jobs: 1 });

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;
let context: ContextService;
let manager: TestTaskManager;

let bed: TestBed;
let wks: Workspace;
let child: cp.ChildProcess;

beforeAll(() => {
  container.snapshot();
});

beforeEach(async () => {
  container.restore();
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');

  const logger = container.get(Logger);
  context = container.get(ContextService);

  manager = new TestTaskManager({ logger });
  container.rebind(TASK_MANAGER).toConstantValue(manager);

  app = render(<Layout />);
  Object.assign(app.stdin, { ref: () => this, unref: () => this });
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await bed.prepareCommand(ExecCommand, wks);

  child = new EventEmitter() as cp.ChildProcess;

  // Mocks
  vi.restoreAllMocks();

  vi.spyOn(cp, 'spawn').mockReturnValue(child);

  vi.spyOn(wks, 'dependencies');
  vi.spyOn(wks, 'devDependencies');
});

afterEach(() => {
  cleanup();
});

// Tests
describe('jill exec', () => {
  it('should run command in current workspace', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('cmd');

    // Should exec command using spawn
    await vi.waitFor(() => {
      expect(cp.spawn).toHaveBeenCalledWith('cmd', [], expect.objectContaining({
        cwd: wks.cwd,
        shell: true,
        stdio: 'inherit',
      }));
    });

    child.emit('close', 0);

    await prom;

    // Should have used dependencies generator
    expect(wks.dependencies).toHaveBeenCalled();
    expect(wks.devDependencies).toHaveBeenCalled();
  });

  it('should use given dependency selection mode', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('exec -d prod cmd');

    // Should exec command using spawn
    await vi.waitFor(() => {
      expect(cp.spawn).toHaveBeenCalled();
    });

    child.emit('close', 0);

    await prom;

    // Should have used dependencies generator
    expect(wks.dependencies).toHaveBeenCalled();
    expect(wks.devDependencies).not.toHaveBeenCalled();
  });

  it('should pass down unknown arguments', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('cmd --arg');

    // Should exec command using spawn
    await vi.waitFor(() => {
      expect(cp.spawn).toHaveBeenCalledWith('cmd', ['--arg'], expect.anything());
    });

    child.emit('close', 0);

    await prom;
  });

  it('should pass down unparsed arguments', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('cmd -- -d toto');

    // Should exec command using spawn
    await vi.waitFor(() => {
      expect(cp.spawn).toHaveBeenCalledWith('cmd', ['-d', 'toto'], expect.anything());
    });

    child.emit('close', 0);

    await prom;

    // Should have used dependencies generator
    expect(wks.dependencies).toHaveBeenCalled();
    expect(wks.devDependencies).toHaveBeenCalled();
  });
});
