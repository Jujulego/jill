import { Command } from '@/src/modules/command';
import { TaskCommand } from '@/src/modules/task-command';

// Command
@Command({
  command: 'task'
})
export class MockTaskCommand extends TaskCommand {
  // Methods
  handler = jest.fn();
  prepare = jest.fn();
}
