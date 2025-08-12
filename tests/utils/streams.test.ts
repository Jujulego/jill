import { combine, streamLines$ } from '@/src/utils/streams.js';
import { SpawnTask } from '@jujulego/tasks';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('streamLines$', () => {
  let task: SpawnTask;

  beforeEach(() => {
    task = new SpawnTask('cmd', [], {});
  });

  it('should emit all received content, line by line', async () => {
    // Data emitted
    setTimeout(() => {
      task.events$.emit('stream.stdout', { data: Buffer.from('first line\n'), stream: 'stdout' });
    }, 0);

    setTimeout(() => {
      task.events$.emit('stream.stdout', { data: Buffer.from('second'), stream: 'stdout' });
    }, 20);

    setTimeout(() => {
      task.events$.emit('stream.stdout', { data: Buffer.from(' line\nth'), stream: 'stdout' });
    }, 40);

    setTimeout(() => {
      task.events$.emit('stream.stdout', { data: Buffer.from('ird line'), stream: 'stdout' });
    }, 60);

    setTimeout(() => {
      task.events$.emit('completed', { status: 'done', duration: 100 });
    }, 100);

    // Checks
    const spyNext = vi.fn();
    const spyComplete = vi.fn();

    streamLines$(task).subscribe({ next: spyNext, complete: spyComplete });

    await vi.waitFor(() => expect(spyNext).toHaveBeenCalledWith('first line'));
    await vi.waitFor(() => expect(spyNext).toHaveBeenCalledWith('second line'));
    await vi.waitFor(() => expect(spyNext).toHaveBeenCalledWith('third line'));
    await vi.waitFor(() => expect(spyComplete).toHaveBeenCalledOnce());

    expect(spyNext).toHaveBeenCalledTimes(3);
  });
});
