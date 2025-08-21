export class ClientError extends Error {
  name = 'ClientError';

  constructor(message: string) {
    super(message);
  }
}