import { Repeater } from '@repeaterjs/repeater';
import * as events from 'events';

// Types
export type Event = string | symbol;
export type EventMap = Record<Event, any[]>;
export type EventListener<M extends EventMap, E extends keyof M> = (...args: M[E]) => void;

// Class
export class EventEmitter<M extends EventMap> extends events.EventEmitter {
  // Methods
  async waitFor<E extends keyof M>(event: E): Promise<M[E]> {
    return new Promise<M[E]>(resolve => {
      this.once(event, (...args) => resolve(args));
    });
  }

  follow<E extends keyof M>(event: E): Repeater<M[E], void> {
    return new Repeater(async (push, stop) => {
      // Setup listener
      function listener(...args: M[E]) {
        push(args);
      }
      this.on(event, listener);

      // Stop listening event
      await stop;
      this.off(event, listener);
    });
  }
}

export declare interface EventEmitter<M extends EventMap> {
  // Methods
  addListener<E extends keyof M>(event: E, listener: EventListener<M, E>): this;
  removeListener<E extends keyof M>(event: E, listener: EventListener<M, E>): this;
  removeAllListeners(event?: keyof M): this;
  on<E extends keyof M>(event: E, listener: EventListener<M, E>): this;
  once<E extends keyof M>(event: E, listener: EventListener<M, E>): this;
  off<E extends keyof M>(event: E, listener: EventListener<M, E>): this;
  listenerCount(event: keyof M): number;
  listeners<E extends keyof M>(event: E): EventListener<M, E>[];
  rawListeners<E extends keyof M>(event: E): EventListener<M, E>[];
  emit<E extends keyof M>(event: E, ...args: M[E]): boolean;
  prependListener<E extends keyof M>(event: E, listener: EventListener<M, E>): this;
  prependOnceListener<E extends keyof M>(event: E, listener: EventListener<M, E>): this;
  eventNames(): Event[];
}
