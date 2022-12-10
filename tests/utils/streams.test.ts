import { streamEvents } from '@jujulego/event-tree';
import { SpawnTask } from '@jujulego/tasks';

import { combine, streamLines } from '@/src/utils';

// Mocks
jest.mock('@jujulego/event-tree', () => {
  const actual = jest.requireActual('@jujulego/event-tree');

  return {
    ...actual,
    streamEvents: jest.fn(actual.streamEvents)
  };
});

// Tests
describe('combine', () => {
  it('should yield all item yielded by given generators in order', async () => {
    const gen1 = async function* () {
      yield 1;
      yield 2;
    };

    const gen2 = async function* () {
      yield* [10, 12];
    };

    await expect(combine(gen1(), gen2()))
      .toYield([1, 2, 10, 12]);
  });
});

describe('streamLines', () => {
  let task: SpawnTask;

  beforeEach(() => {
    task = new SpawnTask('cmd', [], {});
  });

  it('should emit all received content, line by line', async () => {
    jest.spyOn(task, 'exitCode', 'get')
      .mockReturnValue(0);

    setTimeout(() => {
      task.emit('stream.stdout', { data: Buffer.from('first line\n'), stream: 'stdout' });
    }, 0);

    setTimeout(() => {
      task.emit('stream.stdout', { data: Buffer.from('second'), stream: 'stdout' });
    }, 20);

    setTimeout(() => {
      task.emit('stream.stdout', { data: Buffer.from(' line\nth'), stream: 'stdout' });
    }, 40);

    setTimeout(() => {
      task.emit('stream.stdout', { data: Buffer.from('ird line'), stream: 'stdout' });
    }, 60);

    setTimeout(() => {
      task.emit('completed', { status: 'done', duration: 100 });
    }, 100);

    await expect(streamLines(task, 'stdout'))
      .toYield(['first line', 'second line', 'third line']);
  });

  it('should throw error thrown by streamEvents', async () => {
    jest.mocked(streamEvents)
      // eslint-disable-next-line require-yield
      .mockImplementation(async function* () { throw new Error('aborted'); });

    // eslint-disable-next-line no-empty
    await expect(
      (async function () {
        for await (const line of streamLines(task, 'stdout')) {
          console.log(line);
        }
      })()
    ).rejects.toThrow('aborted');
  });
});
