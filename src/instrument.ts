import { init } from '@sentry/node';

init({
  dsn: 'https://53e6d10c16975ebd025175d9836d039b@o4508229080055808.ingest.de.sentry.io/4509876546895952',

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
