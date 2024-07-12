import { beforeEach, describe, expect, it, vi } from 'vitest';

import { linesFrom } from '@/src/utils/events.js';
import { TestSpawnTask } from '@/tools/test-tasks.js';

// Tests
describe('linesFrom', () => {
  let task: TestSpawnTask;

  beforeEach(() => {
    task = new TestSpawnTask('cmd', [], {});
  });

  it('should emit all received content, line by line', async () => {
    vi.spyOn(task, 'exitCode', 'get')
      .mockReturnValue(0);

    const lines = linesFrom(task, 'stdout');

    const listener = vi.fn();
    lines.subscribe(listener);

    // One full line
    task.emit('stream.stdout', { data: Buffer.from('first line\n'), stream: 'stdout' });
    expect(listener).toHaveBeenCalledWith('first line');
    listener.mockReset();

    // Partial line
    task.emit('stream.stdout', { data: Buffer.from('second'), stream: 'stdout' });
    expect(listener).not.toHaveBeenCalled();

    task.emit('stream.stdout', { data: Buffer.from(' line\nth'), stream: 'stdout' });
    expect(listener).toHaveBeenCalledWith('second line');
    listener.mockReset();

    // Final line
    task.emit('stream.stdout', { data: Buffer.from('ird line'), stream: 'stdout' });
    expect(listener).not.toHaveBeenCalled();

    task.emit('completed', { status: 'done', duration: 100 });
    expect(listener).toHaveBeenCalledWith('third line');
  });
});
