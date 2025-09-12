#!/usr/bin/env node

if (process.env.DISABLE_TRACING !== 'true') {
  await import('../dist/instrument.js');
}

import '../dist/main.js';
