import { ParallelGroup, SequenceGroup } from '@jujulego/tasks';

import { container } from '@/src/inversify.config';
import { type Workspace } from '@/src/project/workspace';
import { ScriptTask } from '@/src/tasks/script-task';
import { type GroupNode, TaskExprService, type TaskNode } from '@/src/tasks/task-expr.service';

import { TestBed } from '@/tools/test-bed';

// Setup
let service: TaskExprService;

let bed: TestBed;
let wks: Workspace;

beforeEach(() => {
  container.snapshot();
  service = container.get(TaskExprService);

  bed = new TestBed();
  wks = bed.addWorkspace('wks');
});

afterEach(() => {
  container.restore();
});

// Tests
describe('TaskExprService.parse', () => {
  it('should return simple task (inline syntax)', () => {
    expect(service.parse('toto:dev'))
      .toEqual({
        roots: [
          { script: 'toto:dev' },
        ]
      });
  });

  it('should return simple task (single cote syntax)', () => {
    expect(service.parse('\'\\\\single\\\'cote\\\\\''))
      .toEqual({
        roots: [
          { script: '\\single\'cote\\' },
        ]
      });
  });

  it('should return simple task (double cote syntax)', () => {
    expect(service.parse('"\\\\double\\"cote\\\\"'))
      .toEqual({
        roots: [
          { script: '\\double"cote\\' },
        ]
      });
  });

  it('should return complex tree with 2 operators', () => {
    expect(service.parse('(toto // tata) -> tutu'))
      .toEqual({
        roots: [
          {
            operator: '->',
            tasks: [
              {
                operator: '//',
                tasks: [
                  { script: 'toto' },
                  { script: 'tata' },
                ]
              },
              { script: 'tutu' }
            ]
          }
        ]
      });
  });
});

describe('TaskExprService.buildTask', () => {
  it('should use workspace to create simple task', async () => {
    const tree: TaskNode = { script: 'test' };
    const task = new ScriptTask(wks, 'test', []);

    jest.spyOn(wks, 'run').mockResolvedValue(task);

    await expect(service.buildTask(tree, wks)).resolves.toBe(task);

    expect(wks.run).toHaveBeenCalledWith('test', [], undefined);
  });

  it('should create a parallel group', async () => {
    const tree: GroupNode = {
      operator: '//',
      tasks: [
        { script: 'test1' },
        { script: 'test2' },
      ]
    };
    jest.spyOn(wks, 'run')
      .mockImplementation(async (script) => new ScriptTask(wks, script, []));

    const group = await service.buildTask(tree, wks) as ParallelGroup;

    expect(group).toBeInstanceOf(ParallelGroup);
    expect(group.tasks).toEqual([
      expect.objectContaining({ workspace: wks, script: 'test1' }),
      expect.objectContaining({ workspace: wks, script: 'test2' }),
    ]);

    expect(wks.run).toHaveBeenCalledWith('test1', [], undefined);
    expect(wks.run).toHaveBeenCalledWith('test2', [], undefined);
  });

  it('should create a sequence group', async () => {
    const tree: GroupNode = {
      operator: '->',
      tasks: [
        { script: 'test1' },
        { script: 'test2' },
      ]
    };
    jest.spyOn(wks, 'run')
      .mockImplementation(async (script) => new ScriptTask(wks, script, []));

    const group = await service.buildTask(tree, wks) as SequenceGroup;

    expect(group).toBeInstanceOf(SequenceGroup);
    expect(group.tasks).toEqual([
      expect.objectContaining({ workspace: wks, script: 'test1' }),
      expect.objectContaining({ workspace: wks, script: 'test2' }),
    ]);

    expect(wks.run).toHaveBeenCalledWith('test1', [], undefined);
    expect(wks.run).toHaveBeenCalledWith('test2', [], undefined);
  });
});
