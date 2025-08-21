import { captureException } from '@sentry/node';

export class ClientError extends Error {
  name = 'ClientError';

  constructor(message: string) {
    super(message);
    queueMicrotask(() => captureException(this, { level: 'warning' }));
  }
}