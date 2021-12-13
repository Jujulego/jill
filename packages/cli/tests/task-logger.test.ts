import { Workspace, Project, TaskSet } from '@jujulego/jill-core';

import { MockTask } from '../mocks/task';
import { TaskLogger } from '../src/task-logger';
import { logger } from '../src';
import './logger';

// Constants
const prj = new Project('prj');
const wks1 = new Workspace('wks-1', { name: 'wks-1' } as any, prj);
const wks2 = new Workspace('wks-2', { name: 'wks-2' } as any, prj);

// Setup
let set: TaskSet;
let tsk1: MockTask;
let tsk2: MockTask;

beforeEach(() => {
  jest.restoreAllMocks();

  // Mocks
  set = new TaskSet();

  tsk1 = new MockTask('task-1', { context: { workspace: wks1 }});
  tsk2 = new MockTask('task-2', { context: { workspace: wks2 }});

  set.add(tsk1);
  set.add(tsk2);

  jest.spyOn(logger, 'spin').mockImplementation();
  jest.spyOn(logger, 'succeed').mockImplementation();
  jest.spyOn(logger, 'fail').mockImplementation();
});

// Tests
it('should call given format functions', () => {
  const log = new TaskLogger();
  log.connect(set);

  // Spy formats
  const spySpinMultiple = jest.fn(() => '');
  log.on('spin-multiple', spySpinMultiple);

  const spySpinSimple = jest.fn(() => '');
  log.on('spin-simple', spySpinSimple);

  const spySucceed = jest.fn(() => '');
  log.on('succeed', spySucceed);

  const spyFail = jest.fn(() => '');
  log.on('fail', spyFail);

  // 1 task started
  jest.spyOn(tsk1, 'status', 'get').mockReturnValue('running');
  set.emit('started', tsk1);

  expect(spySpinSimple).toHaveBeenCalledWith(tsk1);

  // 2 task started
  jest.spyOn(tsk2, 'status', 'get').mockReturnValue('running');
  set.emit('started', tsk2);

  expect(spySpinMultiple).toHaveBeenCalledWith(2);

  // succeed 1st task
  jest.spyOn(tsk1, 'status', 'get').mockReturnValue('done');
  set.emit('completed', tsk1);

  expect(spySpinSimple).toHaveBeenCalledWith(tsk2);
  expect(spySucceed).toHaveBeenCalledWith(tsk1);

  // fail 2nd task
  jest.spyOn(tsk2, 'status', 'get').mockReturnValue('failed');
  set.emit('completed', tsk2);

  expect(spyFail).toHaveBeenCalledWith(tsk2);
});

it('should print default messages', () => {
  const log = new TaskLogger();
  log.connect(set);

  // 1 task started
  jest.spyOn(tsk1, 'status', 'get').mockReturnValue('running');
  set.emit('started', tsk1);

  expect(logger.spin).toHaveBeenCalledWith('Building wks-1 ...');

  // 2 task started
  jest.spyOn(tsk2, 'status', 'get').mockReturnValue('running');
  set.emit('started', tsk2);

  expect(logger.spin).toHaveBeenCalledWith('Building 2 workspaces ...');

  // succeed 1st task
  jest.spyOn(tsk1, 'status', 'get').mockReturnValue('done');
  set.emit('completed', tsk1);

  expect(logger.succeed).toHaveBeenCalledWith('wks-1 built');
  expect(logger.spin).toHaveBeenCalledWith('Building wks-2 ...');

  // fail 2nd task
  jest.spyOn(tsk2, 'status', 'get').mockReturnValue('failed');
  set.emit('completed', tsk2);

  expect(logger.fail).toHaveBeenCalledWith('Failed to build wks-2');
});

it('should print default messages (2)', () => {
  const log = new TaskLogger();
  log.connect(set);

  // 1 task started
  jest.spyOn(tsk1, 'status', 'get').mockReturnValue('running');
  set.emit('started', tsk1);

  expect(logger.spin).toHaveBeenCalledWith('Building wks-1 ...');

  // 2 task started
  jest.spyOn(tsk2, 'status', 'get').mockReturnValue('running');
  set.emit('started', tsk2);

  expect(logger.spin).toHaveBeenCalledWith('Building 2 workspaces ...');

  // fail 1st task
  jest.spyOn(tsk1, 'status', 'get').mockReturnValue('failed');
  set.emit('completed', tsk1);

  expect(logger.fail).toHaveBeenCalledWith('Failed to build wks-1');
  expect(logger.spin).toHaveBeenCalledWith('Building wks-2 ...');

  // succeed 2nd task
  jest.spyOn(tsk2, 'status', 'get').mockReturnValue('done');
  set.emit('completed', tsk2);

  expect(logger.succeed).toHaveBeenCalledWith('wks-2 built');
});