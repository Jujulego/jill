import { Plugin } from '@/src/modules/plugin.js';

import { MockCommand } from './mock.command.js';
import { MockTaskCommand } from './mock-task.command.js';

// plugin
@Plugin({
  name: 'mock',
  commands: [
    MockCommand,
    MockTaskCommand
  ]
})
export class MockPlugin {}
