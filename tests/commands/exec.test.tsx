import { type TaskManager } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs, { type CommandModule } from 'yargs';
import { vi } from 'vitest';

import { ExecCommand } from '@/src/commands/exec.js';
import { ContextService } from '@/src/commons/context.service';
import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';
import { type Workspace } from '@/src/project/workspace';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { TestCommandTask } from '@/tools/test-tasks';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;
let context: ContextService;
let manager: TaskManager;

let bed: TestBed;
let wks: Workspace;
let task: TestCommandTask;

beforeAll(() => {
  container.snapshot();
});

beforeEach(async () => {
  container.restore();
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');
  task = new TestCommandTask(wks, 'cmd', [], { logger: spyLogger });

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await bed.prepareCommand(ExecCommand, wks);
  context = container.get(ContextService);
  manager = container.get(TASK_MANAGER);

  // Mocks
  vi.restoreAllMocks();

  vi.spyOn(wks, 'exec').mockResolvedValue(task);

  vi.spyOn(manager, 'add').mockReturnValue(undefined);
  vi.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);
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

    await flushPromises();

    // should create script task then add it to manager
    expect(wks.exec).toHaveBeenCalledWith('cmd', [], { buildDeps: 'all', buildScript: 'build' });
    expect(manager.add).toHaveBeenCalledWith(task);

    // should print task spinner
    expect(app.lastFrame()).toEqual(expect.ignoreColor(/^. cmd/));

    // complete task
    vi.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;

    // should print task completed
    expect(app.lastFrame()).toEqual(expect.ignoreColor(`${symbols.success} cmd (took 100ms)`));
  });

  it('should use given dependency selection mode', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('exec -d prod cmd');

    await flushPromises();

    // should create script task than add it to manager
    expect(wks.exec).toHaveBeenCalledWith('cmd', [], { buildDeps: 'prod', buildScript: 'build' });

    // complete task
    vi.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;
  });

  it('should pass down unknown arguments', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('cmd --arg');

    await flushPromises();

    // should create script task than add it to manager
    expect(wks.exec).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all', buildScript: 'build' });

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
      .parse('cmd -- -d toto');

    await flushPromises();

    // should create script task than add it to manager
    expect(wks.exec).toHaveBeenCalledWith('cmd', ['-d', 'toto'], { buildDeps: 'all', buildScript: 'build' });

    // complete task
    vi.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;
  });
});
