import { injectable } from 'inversify';
import { container } from './inversify.config';

// Interface
export interface SpinnerState {
  spin: boolean;
  label: string;
}

export type SpinnerStateListener = (state: SpinnerState) => void;

// Service
@injectable()
export class SpinnerService {
  // Attributes
  private _spin = false;
  private _label = '';

  private readonly _listeners = new Set<SpinnerStateListener>();

  // Methods
  subscribe(listener: SpinnerStateListener) {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  }

  spin(label: string) {
    this._spin = true;
    this._label = label;

    for (const listener of this._listeners) {
      listener(this.state);
    }
  }

  stop() {
    this._spin = false;

    for (const listener of this._listeners) {
      listener(this.state);
    }
  }

  // Properties
  get state(): SpinnerState {
    return {
      spin: this._spin,
      label: this._label,
    };
  }
}

container.bind(SpinnerService)
  .toSelf()
  .inSingletonScope();
