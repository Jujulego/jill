import { IResolvers } from '@graphql-tools/utils';
import { logger } from '@jujulego/jill-core';
import { Subject } from 'rxjs';

import { Event } from '../event';
import { pubsub } from '../pubsub';

// Types
export interface LogsArgs {
  start: number;
  limit: number;
}

// Constants
const _control = new Subject<Event<null, 'shutdown'>>();
export const $control = _control.asObservable();

// Setup
logger.stream({ start: 0 })
  .on('log', (log) => pubsub.publish('log', log));

// Resolvers
export const ControlResolvers = {
  Query: {
    logs(_: IResolvers, args: LogsArgs): Promise<unknown[]> {
      return new Promise<unknown[]>((resolve, reject) => {
        logger.query({
          start: args.start,
          limit: args.limit,
          order: 'asc',
          fields: null
        }, (err, results: { file: unknown[] }) => {
          if (err) reject(err);

          resolve(results.file);
        });
      });
    }
  },
  Subscription: {
    logs() {
      return pubsub.asyncIterator('logs');
    }
  },
  Mutation: {
    shutdown(): boolean {
      _control.next({ value: null, action: 'shutdown' });
      return true;
    }
  }
};