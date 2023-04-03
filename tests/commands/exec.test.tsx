import { type TaskManager } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs, { type CommandModule } from 'yargs';

import { ExecCommand } from '@/src/commands/exec';
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
  task = new TestCommandTask(wks, 'cmd', ['--arg'], { logger: spyLogger });

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await bed.prepareCommand(ExecCommand, wks);
  context = container.get(ContextService);
  manager = container.get(TASK_MANAGER);

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(wks, 'exec').mockResolvedValue(task);

  jest.spyOn(manager, 'add').mockImplementation();
  jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);
});

afterEach(() => {
  cleanup();
});

// Tests
describe('jill exec', () => {
  it('should run command in current workspace', async () => {
    context.reset();

    // Run command
    const prom = yargs.command(command)
      .fail(false)
      .parse('-w wks cmd -- --arg');

    await flushPromises();

    // should create script task then add it to manager
    expect(wks.exec).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'all' });
    expect(manager.add).toHaveBeenCalledWith(task);

    // should print task spinner
    expect(app.lastFrame()).toEqual(expect.ignoreColor(/^. cmd --arg/));

    // complete task
    jest.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;

    // should print task completed
    expect(app.lastFrame()).toEqual(expect.ignoreColor(`${symbols.success} cmd --arg (took 100ms)`));
  });

  it('should use given dependency selection mode', async () => {
    context.reset();

    // Run command
    const prom = yargs.command(command)
      .fail(false)
      .parse('exec -w wks --deps-mode prod cmd -- --arg');

    await flushPromises();

    // should create script task than add it to manager
    expect(wks.exec).toHaveBeenCalledWith('cmd', ['--arg'], { buildDeps: 'prod' });

    // complete task
    jest.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;
  });
});
