import { multiplexer, source } from '@jujulego/event-tree';
import { inject } from 'inversify';

import { Logger } from '@/src/commons/logger.service.ts';
import { container } from '@/src/inversify.config.ts';
import { INK_APP } from '@/src/ink.config.tsx';
import { Service } from '@/src/modules/service.ts';

// Interface
export type SpinnerStatus = 'spin' | 'stop' | 'success' | 'failed';
export interface SpinnerState {
  status: SpinnerStatus;
  label: string;
}

// Service
@Service()
export class SpinnerService {
  // Attributes
  private readonly _logger: Logger;
  private _status: SpinnerStatus = 'stop';
  private _label = '';
  private _events = multiplexer({
    state: source<SpinnerState>(),
  });

  // Constructor
  constructor(@inject(Logger) logger: Logger) {
    this._logger = logger.child({ label: 'spinner' });
  }

  // Methods
  private _awakeInk() {
    // Ensure ink is instanced => spinner is printed
    container.get(INK_APP);
  }

  spin(label: string) {
    this._logger.debug(`spin: ${label}`);
    this._status = 'spin';
    this._label = label;

    this._events.emit('state', this.state);
    this._awakeInk();
  }

  success(label: string) {
    this._logger.debug(`success: ${label}`);
    this._status = 'success';
    this._label = label;

    this._events.emit('state', this.state);
    this._awakeInk();
  }

  failed(label: string) {
    this._logger.debug(`failed: ${label}`);
    this._status = 'failed';
    this._label = label;

    this._events.emit('state', this.state);
    this._awakeInk();
  }

  stop() {
    if (this._status === 'spin') {
      this._logger.debug(`stop: ${this._label}`);
      this._status = 'stop';

      this._events.emit('state', this.state);
    }
  }

  // Properties
  get on() {
    return this._events.on;
  }

  get off() {
    return this._events.off;
  }

  get state(): SpinnerState {
    return {
      status: this._status,
      label: this._label,
    };
  }
}
