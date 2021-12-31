import { OnModuleInit } from '@nestjs/common';
import { Args, ArgsType, Field, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { logger } from 'packages/core';
import { PubSub } from 'graphql-subscriptions';
import { Subject } from 'rxjs';

import { Event } from '../event';
import { JSONObject } from '../json-obj.scalar';

// Types
@ArgsType()
export class LogsArgs {
  @Field({ nullable: true })
  start: number;

  @Field({ nullable: true })
  limit: number;
}

// Resolver
@Resolver()
export class ControlResolver implements OnModuleInit {
  // Attributes
  private readonly _control = new Subject<Event<null, 'shutdown'>>();
  readonly $control = this._control.asObservable();

  // Constructor
  constructor(
    private readonly pubsub: PubSub
  ) {}

  // Lifecycle
  onModuleInit(): void {
    logger.stream({ start: 0 })
      .on('log', (log) => this.pubsub.publish('log', { log }));
  }

  // Queries
  @Query(() => [JSONObject])
  logs(@Args() args: LogsArgs): Promise<unknown[]> {
    return new Promise<unknown[]>((resolve, reject) => {
      logger.query({
        start: args.start,
        limit: args.limit ?? Infinity,
        order: 'asc',
        fields: null
      }, (err, results: { file: unknown[] }) => {
        if (err) reject(err);

        resolve(results.file);
      });
    });
  }

  // Subscriptions
  @Subscription(() => JSONObject)
  log() {
    return this.pubsub.asyncIterator('log');
  }

  // Mutations
  @Mutation(() => Boolean)
  shutdown(): boolean {
    this._control.next({ value: null, action: 'shutdown' });
    return true;
  }
}
