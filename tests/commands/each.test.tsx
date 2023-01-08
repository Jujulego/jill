import { SpawnTask } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs, { type CommandModule } from 'yargs';

import '@/src/commands/each';
import { COMMAND } from '@/src/bases/command';
import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';
import { LoadProject } from '@/src/middlewares/load-project';
import { CURRENT } from '@/src/project/constants';
import { Project } from '@/src/project/project';
import { type WorkspaceContext } from '@/src/project/workspace';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;

let bed: TestBed;

beforeEach(async () => {
  container.snapshot();

  jest.resetAllMocks();
  jest.restoreAllMocks();

  // Project
  bed = new TestBed();

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await container.getNamedAsync(COMMAND, 'each');

  // Mocks
  jest.spyOn(console, 'log').mockImplementation();

  jest.spyOn(LoadProject.prototype, 'handler').mockImplementation(async () => {
    container.bind(Project).toConstantValue(bed.project).whenTargetNamed(CURRENT);
  });
});

afterEach(() => {
  container.restore();
  cleanup();
});

// Tests
describe('jill each', () => {
  it('should run script in all workspaces having that script', async () => {
    // Setup workspaces
    const workspaces = [
      bed.addWorkspace('wks-1', { scripts: { cmd: 'cmd' } }),
      bed.addWorkspace('wks-2', { scripts: { cmd: 'cmd' } }),
      bed.addWorkspace('wks-3'),
    ];

    // Setup tasks
    const manager = container.get(TASK_MANAGER);

    const tasks = [
      new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[0], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[0].cwd }),
      new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[1], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[1].cwd }),
    ];

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);

    jest.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);
    jest.spyOn(workspaces[1], 'run').mockResolvedValue(tasks[1]);

    // Run command
    const prom = yargs.command(command)
      .parse('each cmd -- --arg');

    // should create script task than add it to manager
    await flushPromises();
    expect(workspaces[0].run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });
    expect(workspaces[1].run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });

    await flushPromises();
    expect(manager.add).toHaveBeenCalledWith(tasks[0]);
    expect(manager.add).toHaveBeenCalledWith(tasks[1]);

    // should print task spinners
    expect(app.lastFrame()).toMatchLines([
      /^. Running cmd in wks-1$/,
      /^. Running cmd in wks-2$/,
    ]);

    // complete tasks
    for (const task of tasks) {
      jest.spyOn(task, 'status', 'get').mockReturnValue('done');
      task.emit('status.done', { status: 'done', previous: 'running' });
      task.emit('completed', { status: 'done', duration: 100 });
    }

    await prom;

    // should print all tasks completed
    expect(app.lastFrame()).toEqualLines([
      `${symbols.success} Running cmd in wks-1 (took 100ms)`,
      `${symbols.success} Running cmd in wks-2 (took 100ms)`,
    ]);
  });

  it('should use given dependency selection mode', async () => {
    // Setup workspaces
    const workspaces = [
      bed.addWorkspace('wks', { scripts: { cmd: 'cmd' } }),
    ];

    // Setup tasks
    const manager = container.get(TASK_MANAGER);

    const tasks = [
      new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[0], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[0].cwd }),
    ];

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);

    jest.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);

    // Run command
    const prom = yargs.command(command)
      .parse('each --deps-mode prod cmd -- --arg');

    // should create script task than add it to manager
    await flushPromises();
    expect(workspaces[0].run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'prod' });

    await flushPromises();

    // complete tasks
    for (const task of tasks) {
      jest.spyOn(task, 'status', 'get').mockReturnValue('done');
      task.emit('status.done', { status: 'done', previous: 'running' });
      task.emit('completed', { status: 'done', duration: 100 });
    }

    await prom;
  });

  it('should exit 1 if one task fails', async () => {
    jest.spyOn(process, 'exit').mockImplementation();

    // Setup workspaces
    const workspaces = [
      bed.addWorkspace('wks-1', { scripts: { cmd: 'cmd' } }),
      bed.addWorkspace('wks-2', { scripts: { cmd: 'cmd' } }),
      bed.addWorkspace('wks-3'),
    ];

    // Setup tasks
    const manager = container.get(TASK_MANAGER);

    const tasks = [
      new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[0], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[0].cwd }),
      new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[1], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[1].cwd }),
    ];

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);

    jest.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);
    jest.spyOn(workspaces[1], 'run').mockResolvedValue(tasks[1]);

    // Run command
    const prom = yargs.command(command)
      .parse('each cmd -- --arg');

    // should create script task than add it to manager
    await flushPromises();
    expect(workspaces[0].run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });
    expect(workspaces[1].run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });

    await flushPromises();
    expect(manager.add).toHaveBeenCalledWith(tasks[0]);
    expect(manager.add).toHaveBeenCalledWith(tasks[1]);

    // should print task spinners
    expect(app.lastFrame()).toMatchLines([
      /^. Running cmd in wks-1$/,
      /^. Running cmd in wks-2$/,
    ]);

    // complete tasks
    jest.spyOn(tasks[0], 'status', 'get').mockReturnValue('done');
    tasks[0].emit('status.done', { status: 'done', previous: 'running' });
    tasks[0].emit('completed', { status: 'done', duration: 100 });

    jest.spyOn(tasks[1], 'status', 'get').mockReturnValue('failed');
    tasks[1].emit('status.failed', { status: 'failed', previous: 'running' });
    tasks[1].emit('completed', { status: 'failed', duration: 100 });

    await prom;

    // should print all tasks completed
    expect(app.lastFrame()).toEqualLines([
      `${symbols.success} Running cmd in wks-1 (took 100ms)`,
      `${symbols.error} Running cmd in wks-2 (took 100ms)`,
    ]);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  describe('private filter', () => {
    it('should run script only in private workspaces (--private)', async () => {
      // Setup workspaces
      const workspaces = [
        bed.addWorkspace('wks-1', { private: true, scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-2', { scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-3', { private: true }),
      ];

      // Setup tasks
      const manager = container.get(TASK_MANAGER);

      const tasks = [
        new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[0], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[0].cwd }),
        new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[1], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[1].cwd }),
      ];

      jest.spyOn(manager, 'add').mockImplementation();
      jest.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);

      jest.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);
      jest.spyOn(workspaces[1], 'run').mockResolvedValue(tasks[1]);

      // Run command
      const prom = yargs.command(command)
        .parse('each --private cmd -- --arg');

      // should create script task than add it to manager
      await flushPromises();
      expect(workspaces[0].run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });
      expect(workspaces[1].run).not.toHaveBeenCalled();

      await flushPromises();
      expect(manager.add).toHaveBeenCalledWith(tasks[0]);
      expect(manager.add).not.toHaveBeenCalledWith(tasks[1]);

      // complete tasks
      for (const task of tasks) {
        jest.spyOn(task, 'status', 'get').mockReturnValue('done');
        task.emit('status.done', { status: 'done', previous: 'running' });
        task.emit('completed', { status: 'done', duration: 100 });
      }

      await prom;
    });

    it('should run script only in private workspaces (--no-private)', async () => {
      // Setup workspaces
      const workspaces = [
        bed.addWorkspace('wks-1', { private: true, scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-2', { scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-3', { private: true }),
      ];

      // Setup tasks
      const manager = container.get(TASK_MANAGER);

      const tasks = [
        new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[0], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[0].cwd }),
        new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[1], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[1].cwd }),
      ];

      jest.spyOn(manager, 'add').mockImplementation();
      jest.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);

      jest.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);
      jest.spyOn(workspaces[1], 'run').mockResolvedValue(tasks[1]);

      // Run command
      const prom = yargs.command(command)
        .parse('each --no-private cmd -- --arg');

      // should create script task than add it to manager
      await flushPromises();
      expect(workspaces[0].run).not.toHaveBeenCalled();
      expect(workspaces[1].run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });

      await flushPromises();
      expect(manager.add).not.toHaveBeenCalledWith(tasks[0]);
      expect(manager.add).toHaveBeenCalledWith(tasks[1]);

      // complete tasks
      for (const task of tasks) {
        jest.spyOn(task, 'status', 'get').mockReturnValue('done');
        task.emit('status.done', { status: 'done', previous: 'running' });
        task.emit('completed', { status: 'done', duration: 100 });
      }

      await prom;
    });
  });

  describe('affected filter', () => {
    it('should run script only in affected workspaces (--affected test)', async () => {
      // Setup workspaces
      const workspaces = [
        bed.addWorkspace('wks-1', { scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-2', { scripts: { cmd: 'cmd' } }),
        bed.addWorkspace('wks-3'),
      ];

      // Setup tasks
      const manager = container.get(TASK_MANAGER);

      const tasks = [
        new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[0], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[0].cwd }),
        new SpawnTask<WorkspaceContext>('cmd', ['--arg'], { workspace: workspaces[1], script: 'cmd' }, { logger: spyLogger, cwd: workspaces[1].cwd }),
      ];

      jest.spyOn(manager, 'add').mockImplementation();
      jest.spyOn(manager, 'tasks', 'get').mockReturnValue(tasks);

      jest.spyOn(workspaces[0], 'run').mockResolvedValue(tasks[0]);
      jest.spyOn(workspaces[1], 'run').mockResolvedValue(tasks[1]);

      jest.spyOn(workspaces[0], 'isAffected').mockResolvedValue(true);
      jest.spyOn(workspaces[1], 'isAffected').mockResolvedValue(false);

      // Run command
      const prom = yargs.command(command)
        .parse('each --affected test cmd -- --arg');

      // should create script task than add it to manager
      await flushPromises();
      expect(workspaces[0].run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });
      expect(workspaces[1].run).not.toHaveBeenCalled();

      await flushPromises();
      expect(manager.add).toHaveBeenCalledWith(tasks[0]);
      expect(manager.add).not.toHaveBeenCalledWith(tasks[1]);

      // complete tasks
      for (const task of tasks) {
        jest.spyOn(task, 'status', 'get').mockReturnValue('done');
        task.emit('status.done', { status: 'done', previous: 'running' });
        task.emit('completed', { status: 'done', duration: 100 });
      }

      await prom;
    });
  });
});
