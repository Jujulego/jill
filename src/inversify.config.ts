import { Container } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import 'reflect-metadata';

import { fixDefaultExport } from '@/src/utils/import.ts';

// Container
export const container = new Container();

// Utilities
export const { lazyInject, lazyInjectNamed } = fixDefaultExport(getDecorators)(container);
