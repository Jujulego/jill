import { vi } from 'vitest';

import { Command } from '@/src/modules/command.js';
import { TaskCommand } from '@/src/modules/task-command.js';

// Command
@Command({
  command: 'task'
})
export class MockTaskCommand extends TaskCommand {
  // Methods
  handler = vi.fn();
  prepare = vi.fn();
}
