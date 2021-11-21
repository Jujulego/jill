import { logger } from '@jujulego/jill-core';
import { Subject } from 'rxjs';

import { Event } from '../event';

// Types
export interface LogsArgs {
  start: number;
  limit: number;
}

// Constants
const _control = new Subject<Event<null, 'shutdown'>>();
export const $control = _control.asObservable();

// Resolvers
export const ControlResolvers = {
  Query: {
    logs(args: LogsArgs): Promise<unknown[]> {
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
  Mutation: {
    shutdown(): boolean {
      _control.next({ value: null, action: 'shutdown' });
      return true;
    }
  }
};