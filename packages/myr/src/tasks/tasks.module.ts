import { Module } from '@nestjs/common';

import { TasksResolver } from './tasks.resolver';
import { WatchManager } from './watch-manager';

// Module
@Module({
  providers: [
    TasksResolver,
    WatchManager
  ],
  exports: [
    WatchManager
  ]
})
export class TasksModule {}