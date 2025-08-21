import { init } from '@sentry/node';

init({
  dsn: 'https://53e6d10c16975ebd025175d9836d039b@o4508229080055808.ingest.de.sentry.io/4509876546895952',
  sendDefaultPii: false,
  tracesSampleRate: 1.0,
});
