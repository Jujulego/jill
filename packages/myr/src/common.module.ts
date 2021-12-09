import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

import { JSONObjectScalar } from './json-obj.scalar';
import { pubsub } from './pubsub';

// Module
@Module({
  providers: [
    JSONObjectScalar,
    { provide: PubSub, useValue: pubsub }
  ],
  exports: [PubSub],
})
export class CommonModule {}
