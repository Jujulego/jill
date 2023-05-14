import { Plugin } from '@/src/modules/plugin';

import { MockCommand } from './mock.command';
import { MockTaskCommand } from './mock-task.command';

// plugin
@Plugin({
  name: 'mock',
  commands: [
    MockCommand,
    MockTaskCommand
  ]
})
export class MockPlugin {}
