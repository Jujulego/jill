import { type TaskManager } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import { vi } from 'vitest';
import yargs, { type CommandModule } from 'yargs';

import { EachCommand } from '@/src/commands/each';
import { SpinnerService } from '@/src/commons/spinner.service';
import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { TestScriptTask } from '@/tools/test-tasks';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils';
import { ExitException } from '@/src/utils/exit';
import { ContextService } from '@/src/commons/context.service';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;
let manager: TaskManager;
let context: ContextService;
let spinner: SpinnerService;

let bed: TestBed;

beforeAll(() => {
  container.snapshot();
});

beforeEach(async () => {
  container.restore();
  container.snapshot();

  vi.resetAllMocks();
  vi.restoreAllMocks();

  // Project
  bed = new TestBed();

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await bed.prepareCommand(EachCommand);
  manager = container.get(TASK_MANAGER);
  context = container.get(ContextService);
  spinner = container.get(SpinnerService);

  // Mocks
  vi.resetAllMocks();
  vi.restoreAllMocks();

  vi.spyOn(manager, 'add').mockImplementation();
});

afterEach(() => {
  cleanup();
});

// Tests
describe('jill each', () => {
  it('should run script in all workspaces having that script', async () => {
    context.reset({});

    // Setup workspaces
    const workspaces = [
      bed.addWorkspace('wks-1', { scripts: { cmd: 'cmd' } }),
      bed.addWorkspace('wks-2', { scripts: { cmd: 'cmd' } }),
      bed.addWorkspace('wks-3'),
    ];

    // Setup tasks
    const tasks = [
      new TestScriptTask(workspaces[0], 'cmd', [], { logger: spyLogger }),
      new TestScriptTask(workspaces[1], 'cmd', [], { logger: spyLogger }),
    ];

    vi.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);

    vi.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);
    vi.spyOn(workspaces[1], 'run').mockResolvedValue(tasks[1]);

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('each cmd');

    // should create script task then add it to manager
    await flushPromises();
    expect(workspaces[0].run).toHaveBeenCalledWith('cmd', [], { buildDeps: 'all', buildScript: 'build' });
    expect(workspaces[1].run).toHaveBeenCalledWith('cmd', [], { buildDeps: 'all', buildScript: 'build' });

    await flushPromises();
    expect(manager.add).toHaveBeenCalledWith(tasks[0]);
    expect(manager.add).toHaveBeenCalledWith(tasks[1]);

    // should print task spinners
    expect(app.lastFrame()).toMatchLines([
      expect.ignoreColor(/^. Running cmd in wks-1$/),
      expect.ignoreColor(/^. Running cmd in wks-2$/),
    ]);

    // complete tasks
    for (const task of tasks) {
      vi.spyOn(task, 'status', 'get').mockReturnValue('done');
      task.emit('status.done', { status: 'done', previous: 'running' });
      task.emit('completed', { status: 'done', duration: 100 });
    }

    await prom;

    // should print all tasks completed
    expect(app.lastFrame()).toEqualLines([
      expect.ignoreColor(`${symbols.success} Running cmd in wks-1 (took 100ms)`),
      expect.ignoreColor(`${symbols.success} Running cmd in wks-2 (took 100ms)`),
    ]);
  });

  it('should use given dependency selection mode', async () => {
    context.reset({});

    // Setup workspaces
    const workspaces = [
      bed.addWorkspace('wks', { scripts: { cmd: 'cmd' } }),
    ];

    // Setup tasks
    const tasks = [
      new TestScriptTask(workspaces[0], 'cmd', [], { logger: spyLogger }),
    ];

    vi.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);
    vi.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('each -d prod cmd');

    // should create script task than add it to manager
    await flushPromises();
    expect(workspaces[0].run).toHaveBeenCalledWith('cmd', [], { buildDeps: 'prod', buildScript: 'build' });

    await flushPromises();

    // complete tasks
    for (const task of tasks) {
      vi.spyOn(task, 'status', 'get').mockReturnValue('done');
      task.emit('status.done', { status: 'done', previous: 'running' });
      task.emit('completed', { status: 'done', duration: 100 });
    }

    await prom;
  });

  it('should exit 1 if no matching workspace is found', async () => {
    context.reset({});
    vi.spyOn(spinner, 'failed');

    // Setup tasks
    vi.spyOn(manager, 'tasks', 'get').mockReturnValue([]);

    // Run command
    await expect(
      yargs().command(command)
        .fail(false)
        .parse('each cmd')
    ).rejects.toEqual(new ExitException(1));

    expect(spinner.failed).toHaveBeenCalledWith('No matching workspace found !');
  });

  it('should pass down unknown arguments', async () => {
    context.reset({});

    // Setup workspaces
    const workspaces = [
      bed.addWorkspace('wks', { scripts: { cmd: 'cmd' } }),
    ];

    // Setup tasks
    const tasks = [
      new TestScriptTask(workspaces[0], 'cmd', ['--arg'], { logger: spyLogger }),
    ];

    vi.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);
    vi.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('each cmd --arg');

    // should create script task than add it to manager
    await flushPromises();
    expect(workspaces[0].run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all', buildScript: 'build' });

    await flushPromises();

    // complete tasks
    for (const task of tasks) {
      vi.spyOn(task, 'status', 'get').mockReturnValue('done');
      task.emit('status.done', { status: 'done', previous: 'running' });
      task.emit('completed', { status: 'done', duration: 100 });
    }

    await prom;
  });

  it('should pass down unparsed arguments', async () => {
    context.reset({});

    // Setup workspaces
    const workspaces = [
      bed.addWorkspace('wks', { scripts: { cmd: 'cmd' } }),
    ];

    // Setup tasks
    const tasks = [
      new TestScriptTask(workspaces[0], 'cmd', ['-d', 'toto'], { logger: spyLogger }),
    ];

    vi.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);
    vi.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('each cmd -- -d toto');

    // should create script task than add it to manager
    await flushPromises();
    expect(workspaces[0].run).toHaveBeenCalledWith('cmd', ['-d', 'toto'], { buildDeps: 'all', buildScript: 'build' });

    await flushPromises();

    // complete tasks
    for (const task of tasks) {
      vi.spyOn(task, 'status', 'get').mockReturnValue('done');
      task.emit('status.done', { status: 'done', previous: 'running' });
      task.emit('completed', { status: 'done', duration: 100 });
    }

    await prom;
  });

  describe('private filter', () => {
    it('should run script only in private workspaces (--private)', async () => {
      context.reset({});

      // Setup workspaces
      const workspaces = [
        bed.addWorkspace('wks-1', { private: true, scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-2', { scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-3', { private: true }),
      ];

      // Setup tasks
      const tasks = [
        new TestScriptTask(workspaces[0], 'cmd', [], { logger: spyLogger }),
        new TestScriptTask(workspaces[1], 'cmd', [], { logger: spyLogger }),
      ];

      vi.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);

      vi.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);
      vi.spyOn(workspaces[1], 'run').mockResolvedValue(tasks[1]);

      // Run command
      const prom = yargs().command(command)
        .fail(false)
        .parse('each --private cmd');

      // should create script task than add it to manager
      await flushPromises();
      expect(workspaces[0].run).toHaveBeenCalledWith('cmd', [], { buildDeps: 'all', buildScript: 'build' });
      expect(workspaces[1].run).not.toHaveBeenCalled();

      await flushPromises();
      expect(manager.add).toHaveBeenCalledWith(tasks[0]);
      expect(manager.add).not.toHaveBeenCalledWith(tasks[1]);

      // complete tasks
      for (const task of tasks) {
        vi.spyOn(task, 'status', 'get').mockReturnValue('done');
        task.emit('status.done', { status: 'done', previous: 'running' });
        task.emit('completed', { status: 'done', duration: 100 });
      }

      await prom;
    });

    it('should run script only in private workspaces (--no-private)', async () => {
      context.reset({});

      // Setup workspaces
      const workspaces = [
        bed.addWorkspace('wks-1', { private: true, scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-2', { scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-3', { private: true }),
      ];

      // Setup tasks
      const tasks = [
        new TestScriptTask(workspaces[0], 'cmd', [], { logger: spyLogger }),
        new TestScriptTask(workspaces[1], 'cmd', [], { logger: spyLogger }),
      ];

      vi.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);

      vi.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);
      vi.spyOn(workspaces[1], 'run').mockResolvedValue(tasks[1]);

      // Run command
      const prom = yargs().command(command)
        .fail(false)
        .parse('each --no-private cmd');

      // should create script task than add it to manager
      await flushPromises();
      expect(workspaces[0].run).not.toHaveBeenCalled();
      expect(workspaces[1].run).toHaveBeenCalledWith('cmd', [], { buildDeps: 'all', buildScript: 'build' });

      await flushPromises();
      expect(manager.add).not.toHaveBeenCalledWith(tasks[0]);
      expect(manager.add).toHaveBeenCalledWith(tasks[1]);

      // complete tasks
      for (const task of tasks) {
        vi.spyOn(task, 'status', 'get').mockReturnValue('done');
        task.emit('status.done', { status: 'done', previous: 'running' });
        task.emit('completed', { status: 'done', duration: 100 });
      }

      await prom;
    });
  });

  describe('affected filter', () => {
    it('should run script only in affected workspaces (--affected test)', async () => {
      context.reset({});

      // Setup workspaces
      const workspaces = [
        bed.addWorkspace('wks-1', { scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-2', { scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-3'),
      ];

      // Setup tasks
      const tasks = [
        new TestScriptTask(workspaces[0], 'cmd', [], { logger: spyLogger }),
        new TestScriptTask(workspaces[1], 'cmd', [], { logger: spyLogger }),
      ];

      vi.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);

      vi.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);
      vi.spyOn(workspaces[1], 'run').mockResolvedValue(tasks[1]);

      vi.spyOn(workspaces[0], 'isAffected').mockResolvedValue(true);
      vi.spyOn(workspaces[1], 'isAffected').mockResolvedValue(false);

      // Run command
      const prom = yargs().command(command)
        .fail(false)
        .parse('each --affected test cmd');

      // should create script task than add it to manager
      await flushPromises();
      expect(workspaces[0].run).toHaveBeenCalledWith('cmd', [], { buildDeps: 'all', buildScript: 'build' });
      expect(workspaces[1].run).not.toHaveBeenCalled();

      await flushPromises();
      expect(manager.add).toHaveBeenCalledWith(tasks[0]);
      expect(manager.add).not.toHaveBeenCalledWith(tasks[1]);

      // complete tasks
      for (const task of tasks) {
        vi.spyOn(task, 'status', 'get').mockReturnValue('done');
        task.emit('status.done', { status: 'done', previous: 'running' });
        task.emit('completed', { status: 'done', duration: 100 });
      }

      await prom;
    });
  });
});
