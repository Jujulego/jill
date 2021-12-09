import { Module } from '@nestjs/common';

import { CommonModule } from '../common.module';
import { ControlResolver } from './control.resolver';

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