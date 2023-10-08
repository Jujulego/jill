import { filter$, flow$, var$ } from '@jujulego/aegis';
import { Observable, OffFn, source$ } from '@jujulego/event-tree';
import { LogLevel, toStderr } from '@jujulego/logger';
import { interfaces as int } from 'inversify';
import wt from 'node:worker_threads';

import { OnServiceActivate, Service } from '@/src/modules/service.ts';

import { ThreadGateway } from './thread.gateway.ts';
import { JillLog } from './types.ts';

// Service
@Service()
export class LogGateway implements Observable<JillLog>, OnServiceActivate {
  // Attributes
  readonly level$ = var$(LogLevel.info);

  private readonly _source = source$<JillLog>();

  // Lifecycle
  onServiceActivate({ container }: int.Context) {
    const threadGtw = container.get(ThreadGateway);

    if (wt.isMainThread) {
      // Redirect logs to stderr
      flow$(
        this._source,
        toStderr(),
      );

      // Add thread gateway as input
      this.connect(threadGtw);
    } else {
      // Redirect logs to thread gateway
      flow$(this._source,
        threadGtw
      );
    }
  }

  // Methods
  readonly subscribe = this._source.subscribe;
  readonly unsubscribe = this._source.unsubscribe;
  readonly clear = this._source.clear;

  connect(origin: Observable<JillLog>): OffFn {
    return flow$(origin,
      filter$((log) => log.level >= this.level),
      this._source
    );
  }

  // Properties
  get level(): LogLevel {
    return this.level$.read();
  }

  set level(level: LogLevel) {
    this.level$.mutate(level);
  }
}
