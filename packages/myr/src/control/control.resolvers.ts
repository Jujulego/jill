import { Subject } from 'rxjs';

import { Event } from '../event';

// Constants
const _control = new Subject<Event<null, 'shutdown'>>();
export const $control = _control.asObservable();

// Resolvers
export const ControlResolvers = {
  Mutation: {
    shutdown(): boolean {
      _control.next({ value: null, action: 'shutdown' });
      return true;
    }
  }
};