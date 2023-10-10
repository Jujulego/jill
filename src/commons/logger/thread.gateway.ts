import { Source, source$ } from '@jujulego/event-tree';
import { LogLevel, quick, withTimestamp } from '@jujulego/logger';
import { BroadcastChannel } from 'node:worker_threads';

import { Service } from '@/src/modules/service.ts';

import { JillLog } from './types.ts';

// Gateway
@Service()
export class ThreadGateway implements Source<JillLog> {
  // Attributes
  readonly channel: BroadcastChannel;

  private readonly _source = source$<JillLog>();

  // Constructor
  constructor() {
    this.channel = new BroadcastChannel('jujulego:jill:logger');
    this.channel.unref();

    this.channel.onmessage = (log) => {
      this._source.next((log as MessageEvent<JillLog>).data);
    };

    this.channel.onmessageerror = (data) => {
      this._source.next(withTimestamp()({
        level: LogLevel.error,
        message: quick.string`Unable to read message: #!json:${(data as MessageEvent).data}`
      }));
    };
  }

  // Methods
  next(data: JillLog): void {
    this.channel.postMessage(data);
  }

  readonly subscribe = this._source.subscribe;
  readonly unsubscribe = this._source.unsubscribe;
  readonly clear = this._source.clear;
}
