import { ParallelGroup, SpawnTask, type Task, type TaskManager } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import { injectable } from 'inversify';
import symbols from 'log-symbols';

import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';
import { TaskCommand } from '@/src/modules/task-command';
import { type Workspace } from '@/src/project/workspace';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import Layout from '@/src/ui/layout';
import { ExitException } from '@/src/utils/exit';
import { printJson } from '@/src/utils/json';

import { TestBed } from '@/tools/test-bed';
import { TestScriptTask } from '@/tools/test-tasks';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils';
import { Logger } from '@/src/commons/logger.service';

// Class
@injectable()
class TestTaskCommand extends TaskCommand {
  // Methods
  // eslint-disable-next-line require-yield
  *prepare(): Generator<Task> {
    return;
  }
}

// Setup
let app: ReturnType<typeof render>;
let manager: TaskManager;
let command: TaskCommand;

let bed: TestBed;
let wks: Workspace;
let task: TestScriptTask;

jest.mock('@/src/utils/json');

beforeEach(async () => {
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');
  task = new TestScriptTask(wks, 'cmd', [], { logger: spyLogger });

  app = render(<Layout/>);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = container.resolve(TestTaskCommand);
  manager = container.get(TASK_MANAGER);

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(command, 'prepare').mockImplementation(function* () {
    yield task;
  });

  jest.spyOn(manager, 'add').mockImplementation();
  jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);
});

afterEach(() => {
  container.restore();
  cleanup();
});

// Tests
describe('TaskCommand', () => {
  describe('run mode', () => {
    it('should start yielded tasks and print their status', async () => {
      // Run command
      const prom = command.handler({ $0: 'jill', _: [] });
      await flushPromises();

      // should add task to manager
      expect(manager.add).toHaveBeenCalledWith(task);

      // should print task spinner
      expect(app.lastFrame()).toEqual(expect.ignoreColor(/^. Running cmd in wks$/));

      // complete task
      jest.spyOn(task, 'status', 'get').mockReturnValue('done');
      task.emit('status.done', { status: 'done', previous: 'running' });
      task.emit('completed', { status: 'done', duration: 100 });

      await prom;

      // should print task completed
      expect(app.lastFrame()).toEqual(expect.ignoreColor(`${symbols.success} Running cmd in wks (took 100ms)`));
    });

    it('should exit 1 if a task fails', async () => {
      // Run command
      const prom = command.handler({ $0: 'jill', _: [] });
      await flushPromises();

      // complete task
      jest.spyOn(task, 'status', 'get').mockReturnValue('failed');
      task.emit('status.failed', { status: 'failed', previous: 'running' });
      task.emit('completed', { status: 'failed', duration: 100 });

      await expect(prom).rejects.toEqual(new ExitException(1));

      // should print task failed
      expect(app.lastFrame()).toEqual(expect.ignoreColor(`${symbols.error} Running cmd in wks (took 100ms)`));
    });

    it('should log and exit if no task were yielded', async () => {
      const logger = container.get(Logger);

      jest.spyOn(logger, 'warn').mockImplementation();
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.mocked(command.prepare).mockImplementation(function* () {});

      // Run command
      await command.handler({ $0: 'jill', _: [] });

      // should have only logged
      expect(manager.add).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(['No task found']);
    });
  });

  describe('plan mode', () => {
    it('should print plan in a list (--plan --plan-mode list)', async () => {
      // Run command
      await command.handler({ $0: 'jill', _: [], plan: true, planMode: 'list' });

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Id      Name  Workspace  Group  Depends on'),
        expect.ignoreColor(`${task.id.substring(0, 6)}  ${task.name}   ${wks.name}`),
      ]);
    });

    it('should print plan with dependent tasks as list', async () => {
      // Create tasks
      const tsk1 = new SpawnTask('test1', [], { workspace: wks, script: 'test1' }, { logger: spyLogger });
      const tsk2 = new SpawnTask('test2', [], { workspace: wks, script: 'test2' }, { logger: spyLogger });

      task.dependsOn(tsk1);
      task.dependsOn(tsk2);
      tsk1.dependsOn(tsk2);

      jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task, tsk1, tsk2]);
      jest.spyOn(command, 'prepare').mockImplementation(function* () {
        yield task;
        yield tsk1;
        yield tsk2;
      });

      // Run command
      await command.handler({ $0: 'jill', _: [], plan: true, planMode: 'list' });

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Id      Name   Workspace  Group  Depends on'),
        expect.ignoreColor(`${tsk2.id.substring(0, 6)}  ${tsk2.name}  ${wks.name}`),
        expect.ignoreColor(`${tsk1.id.substring(0, 6)}  ${tsk1.name}  ${wks.name}               ${tsk2.id.substring(0, 6)}`),
        expect.ignoreColor(`${task.id.substring(0, 6)}  ${task.name}    ${wks.name}               ${tsk1.id.substring(0, 6)}, ${tsk2.id.substring(0, 6)}`),
      ]);
    });

    it('should print plan with group task as list', async () => {
      // Create group
      const tsk1 = new SpawnTask('test1', [], { workspace: wks, script: 'test1' }, { logger: spyLogger });
      const tsk2 = new SpawnTask('test2', [], { workspace: wks, script: 'test2' }, { logger: spyLogger });

      const group = new ParallelGroup('Test group', {}, { logger: spyLogger });
      group.add(tsk1);
      group.add(tsk2);

      jest.spyOn(manager, 'tasks', 'get').mockReturnValue([group]);
      jest.spyOn(command, 'prepare').mockImplementation(function* () {
        yield group;
      });

      // Run command
      await command.handler({ $0: 'jill', _: [], plan: true, planMode: 'list' });

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Id      Name        Workspace  Group   Depends on'),
        expect.ignoreColor(`${group.id.substring(0, 6)}  ${group.name}`),
        expect.ignoreColor(`${tsk1.id.substring(0, 6)}  ${tsk1.name}       ${wks.name}        ${group.id.substring(0, 6)}`),
        expect.ignoreColor(`${tsk2.id.substring(0, 6)}  ${tsk2.name}       ${wks.name}        ${group.id.substring(0, 6)}`),
      ]);
    });

    it('should print plan in json (--plan --plan-mode json)', async () => {
      // Run command
      await command.handler({ $0: 'jill', _: [], plan: true, planMode: 'json' });

      expect(printJson).toHaveBeenCalledWith([task.summary]);
    });
  });
});
