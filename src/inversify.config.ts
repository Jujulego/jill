import { Container } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import 'reflect-metadata/lite';

import { fixDefaultExport } from '@/src/utils/import.js';

// Container
export const container = new Container();

// Utilities
export const { lazyInject, lazyInjectNamed } = fixDefaultExport(getDecorators)(container);
