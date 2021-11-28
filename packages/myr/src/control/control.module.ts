import { Module } from '@nestjs/common';

import { CommonModule } from '../common.module';
import { ControlResolver } from './control.resolvers';

// Module
@Module({
  imports: [
    CommonModule
  ],
  providers: [
    ControlResolver
  ],
  exports: [
    ControlResolver
  ]
})
export class ControlModule {}