import { type LogEntry } from 'winston';
import Transport from 'winston-transport';
import { BroadcastChannel } from 'node:worker_threads';

// Transport
export class ThreadTransport extends Transport {
  // Attributes
  readonly channel: BroadcastChannel;

  // Constructor
  constructor(channel: string) {
    super({
      level: 'debug',
    });

    this.channel = new BroadcastChannel(channel);
    this.channel.onmessageerror = (err) => {
      this.emit('error', err);
    };
    this.channel.unref();
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
