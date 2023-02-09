import Transport from 'winston-transport';
import { BroadcastChannel } from 'node:worker_threads';
import type { LogEntry } from 'winston';

// Transport
export class ThreadTransport extends Transport {
  // Attributes
  readonly channel: BroadcastChannel;

  // Constructor
  constructor(channel: string) {
    super();

    this.channel = new BroadcastChannel(channel);
    this.channel.onmessageerror = (err) => {
      this.emit('error', err);
    };
  }

  // Methods
  log(info: LogEntry, next: () => void): void {
    this.channel.postMessage(info);
    this.emit('logged', info);

    next();
  }

  close(cb?: () => void) {
    this.channel.close();

    if (cb) cb();
    this.emit('closed');
  }
}
