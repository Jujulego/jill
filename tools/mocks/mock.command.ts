import { vi } from 'vitest';

import { Command, type ICommand } from '@/src/modules/command.js';

// Command
@Command({
  command: 'mock'
})
export class MockCommand implements ICommand {
  // Methods
  handler = vi.fn();
}
