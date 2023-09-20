import { type TaskManager } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs, { type CommandModule } from 'yargs';
import { vi } from 'vitest';

import { RunCommand } from '@/src/commands/run.js';
import { ContextService } from '@/src/commons/context.service.js';
import { INK_APP } from '@/src/ink.config.js';
import { container } from '@/src/inversify.config.js';
import { type Workspace } from '@/src/project/workspace.js';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config.js';
import Layout from '@/src/ui/layout.js';
import { ExitException } from '@/src/utils/exit.js';

import { TestBed } from '@/tools/test-bed.js';
import { TestScriptTask } from '@/tools/test-tasks.js';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils.js';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;
let context: ContextService;
let manager: TaskManager;

let bed: TestBed;
let wks: Workspace;
let task: TestScriptTask;

beforeAll(() => {
  container.snapshot();
});

beforeEach(async () => {
  container.restore();
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');
  task = new TestScriptTask(wks, 'cmd', [], { logger: spyLogger });

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await bed.prepareCommand(RunCommand, wks);
  context = container.get(ContextService);
  manager = container.get(TASK_MANAGER);

  // Mocks
  vi.restoreAllMocks();

  vi.spyOn(wks, 'run').mockResolvedValue(task);

  vi.spyOn(manager, 'add').mockReturnValue(undefined);
  vi.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);
});

afterEach(() => {
  cleanup();
});

// Tests
describe('jill run', () => {
  it('should run command in current workspace', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('run cmd');

    await flushPromises();

    // should create script task then add it to manager
    expect(wks.run).toHaveBeenCalledWith('cmd', [], { buildDeps: 'all', buildScript: 'build' });
    expect(manager.add).toHaveBeenCalledWith(task);

    // should print task spinner
    expect(app.lastFrame()).toEqual(expect.ignoreColor(/^. Running cmd in wks$/));

    // complete task
    vi.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;

    // should print task completed
    expect(app.lastFrame()).toEqual(expect.ignoreColor(`${symbols.success} Running cmd in wks (took 100ms)`));
  });

  it('should use given dependency selection mode', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('run -d prod cmd');

    await flushPromises();

    // should create script task than add it to manager
    expect(wks.run).toHaveBeenCalledWith('cmd', [], { buildDeps: 'prod', buildScript: 'build' });

    // complete task
    vi.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;
  });

  it('should exit 1 if script does not exist', async () => {
    context.reset();

    vi.spyOn(wks, 'run').mockResolvedValue(null);
    vi.spyOn(manager, 'tasks', 'get').mockReturnValue([]);

    // Run command
    await expect(
      yargs().command(command)
        .fail(false)
        .parse('run cmd')
    ).rejects.toEqual(new ExitException(1));
  });

  it('should pass down unknown arguments', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('run cmd --arg');

    await flushPromises();

    // should create script task than add it to manager
    expect(wks.run).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all', buildScript: 'build' });

    // complete task
    vi.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;
  });

  it('should pass down unparsed arguments', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('run cmd -- -d toto');

    await flushPromises();

    // should create script task than add it to manager
    expect(wks.run).toHaveBeenCalledWith('cmd', ['-d', 'toto'], { buildDeps: 'all', buildScript: 'build' });

    // complete task
    vi.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;
  });
});
