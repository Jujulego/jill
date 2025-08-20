import { childProcessIntegration, fsIntegration, init } from '@sentry/node';

init({
  debug: true,
  dsn: 'https://53e6d10c16975ebd025175d9836d039b@o4508229080055808.ingest.de.sentry.io/4509876546895952',
  integrations: [
    childProcessIntegration(),
    fsIntegration(),
  ],
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
});
