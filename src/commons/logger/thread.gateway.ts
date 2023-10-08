import { Source, source$ } from '@jujulego/event-tree';
import { LogLevel, quick, withTimestamp } from '@jujulego/logger';
import { BroadcastChannel } from 'node:worker_threads';

import { Service } from '@/src/modules/service.ts';

import { JillLog } from './types.ts';

// Gateway
@Service()
export class ThreadGateway implements Source<JillLog> {
  // Attributes
  private readonly _channel: BroadcastChannel;
  private readonly _source = source$<JillLog>();

  // Constructor
  constructor() {
    this._channel = new BroadcastChannel('jujulego:jill:logger');

    this._channel.onmessage = (log) => {
      this._source.next(log as JillLog);
    };

    this._channel.onmessageerror = (data) => {
      this._source.next(withTimestamp()({
        level: LogLevel.error,
        message: quick.string`Unable to read message: #!json:${data as object}`
      }));
    };
    this._channel.unref();
  }

  // Methods
  next(data: JillLog): void {
    this._channel.postMessage(data);
  }

  readonly subscribe = this._source.subscribe;
  readonly unsubscribe = this._source.unsubscribe;
  readonly clear = this._source.clear;
}
